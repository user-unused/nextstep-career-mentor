"use client";

import React, { useEffect, useState } from "react";
import MDEditor from "@uiw/react-md-editor";
import useFetch from "@/hooks/use-fetch";
import html2pdf from "html2pdf.js/dist/html2pdf.min.js";
import { updateCoverLetter } from "@/actions/cover-letter";
import { Button } from "@/components/ui/button";
import { Download, Edit, Loader2, Monitor, Upload } from "lucide-react";
import { toast } from "sonner";

const CoverLetterPreview = ({ id, content }) => {
  const [previewContent, setPreviewContent] = useState(content);
  const [resumeMode, setResumeMode] = useState("preview");
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    loading: isUpdating,
    fn: updateCoverLetterFn,
    data: updatedResult,
    error: updateError,
  } = useFetch(updateCoverLetter);

  // Handle save result
  useEffect(() => {
    if (updatedResult && !isUpdating) {
      toast.success("Cover Letter saved successfully!");
    }
    if (updateError) {
      toast.error(updateError.message || "Failed to update cover letter");
    }
  }, [updatedResult, updateError, isUpdating]);

  const handleSubmit = async () => {
    if (!previewContent.trim()) {
      toast.error("Content cannot be empty");
      return;
    }

    try {
      //console.log(id,{content:previewContent})
      await updateCoverLetterFn({ id, content: previewContent });
    } catch (error) {
      console.error("Update error:", error);
    }
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const element = document.getElementById("cover-letter-pdf");

      const opt = {
        margin: [15, 15],
        filename: `cover-letter-${new Date().toISOString().split("T")[0]}`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("PDF generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <div className="flex flex-row items-end justify-between mt-4">
          <Button
            variant="link"
            type="button"
            className="flex items-center"
            onClick={() =>
              setResumeMode(resumeMode === "preview" ? "edit" : "preview")
            }
          >
            {resumeMode === "preview" ? (
              <>
                <Edit className="h-4 w-4" />
                Edit Resume
              </>
            ) : (
              <>
                <Monitor className="h-4 w-4" />
                Show Preview
              </>
            )}
          </Button>

        <div className="space-x-2 items-end mb-4">
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Update
              </>
            )}
          </Button>
          <Button onClick={generatePDF} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
        </div>
      </div>
      <div className="">
        <MDEditor
          value={previewContent}
          onChange={setPreviewContent}
          preview={resumeMode}
          height={700}
        />
      </div>

      <div className="hidden">
        <div id="cover-letter-pdf">
          <MDEditor.Markdown
            source={previewContent}
            style={{ background: "white", color: "black" }}
          />
        </div>
      </div>
    </>
  );
};

export default CoverLetterPreview;
