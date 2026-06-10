import type { Request, Response } from "express";
import prisma from "../config/db";
import axios from "axios";

const FASTAPI_URL = process.env.FASTAPI_URL;

// uploading the resume

export const uploadResume = async (req: Request, res: Response) => {
  try {
    const { pdfUrl } = req.body;

    if (!pdfUrl) {
      return res.status(400).json({
        success: false,
        error: "PDF URL is required.",
      });
    }

    const resume = await prisma.resume.create({
      data: {
        userId: req.userId as string,
        pdf_url: pdfUrl,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Resume saved successfully.",
      resume: {
        id: resume.id,
        pdfUrl: resume.pdf_url,
        uploadedAt: resume.uploadedAt,
      },
    });
  } catch (error) {
    console.error("Upload resume error:", error);
    return res.status(500).json({
      success: false,
      error: "Could not save resume. Try again.",
    });
  }
};

// get all the resume

export const getAllResume = async (req: Request, res: Response) => {
  try {
    const resumes = await prisma.resume.findMany({
      where: { userId: req.userId },
      orderBy: { uploadedAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      resumes,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      error: "Could not find resumes .Try again",
    });
  }
};

// delete the resume

export const deleteResume = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const resume = await prisma.resume.findUnique({
      where: { id },
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        error: "Resume not found.",
      });
    }

    if (resume.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: "You do not have permission to delete this resume.",
      });
    }

    await prisma.$transaction([
      prisma.analysis.deleteMany({
        where: {
          resumeId: id,
        },
      }),

      prisma.resume.delete({
        where: {
          id,
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Resume deleted successfully.",
    });
  } catch (error) {
    console.error("Delete resume error:", error);

    return res.status(500).json({
      success: false,
      error: "Could not delete resume. Try again.",
    });
  }
};

// needs the pdfurl, job title ,and resumeId for analizing it
export const analyzeResume = async (req: Request, res: Response) => {
  try {
    const { pdfUrl, jobTitle } = req.body;

    if (!pdfUrl || !jobTitle) {
      return res.status(400).json({
        success: false,
        error: "pdfUrl and jobTitle are required.",
      });
    }

    // Step 1 — save resume to database
    const resume = await prisma.resume.create({
      data: {
        userId: req.userId as string,
        pdf_url: pdfUrl,
      },
    });

    // Step 2 — send to FastAPI and get job_id
    const fastApiRes = await axios.post(`${FASTAPI_URL}/analyze`, {
      pdf_url: pdfUrl,
      job_title: jobTitle,
    });
    const { job_id } = fastApiRes.data;

    // Step 3 — poll until done
    const result = await new Promise<any>((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          const statusRes = await axios.get(
            `${FASTAPI_URL}/analyze/status/${job_id}`,
          );
          const statusData = statusRes.data;

          if (statusData.status === "done") {
            clearInterval(interval);
            resolve(statusData.data);
          } else if (statusData.status === "failed") {
            clearInterval(interval);
            reject(new Error(statusData.error || "Analysis failed."));
          }
        } catch (err) {
          clearInterval(interval);
          reject(err);
        }
      }, 3000);
    });

    // Step 4 — save result to database
    const analysis = await prisma.analysis.create({
      data: {
        userId: req.userId as string,
        resumeId: resume.id,
        jobTitle,
        atsScore: result?.hero?.ats_score || 0,
        fullResult: result,
      },
    });

    // Step 5 — return everything
    return res.status(200).json({
      success: true,
      analysisId: analysis.id,
      resumeId: resume.id,
      data: result,
    });
  } catch (error) {
    console.error("Analyze resume error:", error);
    return res.status(500).json({
      success: false,
      error: "Analysis failed. Try again.",
    });
  }
};

// get the history of the analysis

export const getHistory = async (req: Request, res: Response) => {
  try {
    const analyses = await prisma.analysis.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        jobTitle: true,
        atsScore: true,
        createdAt: true,
        resumeId: true,
      },
    });

    return res.status(200).json({
      success: true,
      analyses,
    });
  } catch (error) {
    console.error("Get history error:", error);
    return res.status(500).json({
      success: false,
      error: "Could not fetch history. Try again.",
    });
  }
};

// get one full analysis result
export const getOneAnalysis = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const analysis = await prisma.analysis.findUnique({
      where: { id },
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: "Analysis not found.",
      });
    }

    if (analysis.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: "You do not have permission to view this.",
      });
    }

    return res.status(200).json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("Get one analysis error:", error);
    return res.status(500).json({
      success: false,
      error: "Could not fetch analysis. Try again.",
    });
  }
};

export const chatResume = async (req: Request, res: Response) => {
  try {
    const { pdfUrl, message } = req.body;

    if (!pdfUrl) {
      return res
        .status(404)
        .json({ success: false, error: "Please Upload the PDF" });
    }
    if (!message) {
      return res.status(404).json({
        success: false,
        error: "Please Enter the message You want to Ask",
      });
    }

    const resume = await prisma.resume.create({
      data: {
        userId: req.userId as string,
        pdf_url: pdfUrl,
      },
    });

    const fastApiRes = await axios.post(`${FASTAPI_URL}/chat`, {
      pdf_url: pdfUrl,
      message,
      user_id: req.userId as string,
    });

    return res.status(200).json({
      success: true,
      data: fastApiRes.data,
    });
  } catch (error) {
    console.log("error");
    return res.status(500).json({
      success: false,
      error,
    });
  }
};
