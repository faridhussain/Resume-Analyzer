import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/db";
import type { Request, Response } from "express";
import { sendOTPEmail } from "../utils/mailer";
import crypto from "crypto";
import redisClient from "../../config/redis";

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "All fields required",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
      },
    });

    const otp = crypto.randomInt(1000, 9999).toString();

    const otpHash = await bcrypt.hash(otp, 10);

    await redisClient.set(`otp:${email}`, otpHash, {
      EX: 300,
    });

    await sendOTPEmail(email, otp);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      userId: user.id,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error,
    });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    const storedOtpHash = await redisClient.get(`otp:${email}`);

    if (!storedOtpHash) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    const valid = await bcrypt.compare(otp, storedOtpHash);

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    await redisClient.del(`otp:${email}`);

    const registerToken = jwt.sign(
      { email },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" },
    );

    res.cookie("registerToken", registerToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      registerToken,
      message: "OTP verified",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error,
    });
  }
};

export const setPassword = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: {
        email: email,
      },
      data: {
        password: hashedPassword,
        isVerified: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Registration completed",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error,
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Email not found",
      });
    }

    // Check registration completed
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: "Please complete email verification and account setup",
      });
    }

    // Check password exists
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: "Account setup incomplete",
      });
    }

    // Compare password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "7d",
      },
    );

    // Store in cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

//get the user profile

export const profile = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      omit: {
        password: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found.",
      });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Me error:", error);
    return res.status(500).json({
      success: false,
      error: "Something went wrong. Try again.",
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    res.clearCookie("token");

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Trouble in Logout",
    });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isVerified: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Get All Users Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
