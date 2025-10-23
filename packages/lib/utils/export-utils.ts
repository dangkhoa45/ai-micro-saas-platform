import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface ExportOptions {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
}

/**
 * Export content as PDF
 */
export async function exportToPDF(
  content: string,
  options: ExportOptions = {}
): Promise<void> {
  try {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Set document properties
    if (options.title) pdf.setProperties({ title: options.title });
    if (options.author) pdf.setProperties({ author: options.author });
    if (options.subject) pdf.setProperties({ subject: options.subject });
    if (options.keywords) pdf.setProperties({ keywords: options.keywords });

    // Add title
    if (options.title) {
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text(options.title, 20, 20);
    }

    // Add content
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margins = { top: 30, bottom: 20, left: 20, right: 20 };
    const maxLineWidth = pageWidth - margins.left - margins.right;

    // Split content into lines
    const lines = pdf.splitTextToSize(content, maxLineWidth);
    let cursorY = options.title ? 40 : 20;

    lines.forEach((line: string) => {
      if (cursorY > pageHeight - margins.bottom) {
        pdf.addPage();
        cursorY = margins.top;
      }
      pdf.text(line, margins.left, cursorY);
      cursorY += 7;
    });

    // Download PDF
    const fileName = options.title
      ? `${options.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`
      : "document.pdf";

    pdf.save(fileName);
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    throw new Error("Failed to export PDF");
  }
}

/**
 * Export content from HTML element as PDF
 */
export async function exportElementToPDF(
  elementId: string,
  options: ExportOptions = {}
): Promise<void> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? "landscape" : "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 10;

    pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight + 10;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    const fileName = options.title
      ? `${options.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`
      : "document.pdf";

    pdf.save(fileName);
  } catch (error) {
    console.error("Error exporting element to PDF:", error);
    throw new Error("Failed to export PDF");
  }
}

/**
 * Export content as plain text file
 */
export function exportToText(
  content: string,
  fileName: string = "document.txt"
): void {
  try {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting to text:", error);
    throw new Error("Failed to export text file");
  }
}

/**
 * Export content as Markdown file
 */
export function exportToMarkdown(
  content: string,
  fileName: string = "document.md"
): void {
  try {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting to markdown:", error);
    throw new Error("Failed to export markdown file");
  }
}

/**
 * Copy content to clipboard
 */
export async function copyToClipboard(content: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(content);
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = content;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
    } catch (err) {
      console.error("Fallback copy failed:", err);
      throw new Error("Failed to copy to clipboard");
    }
    document.body.removeChild(textArea);
  }
}

/**
 * Get word count from content
 */
export function getWordCount(content: string): number {
  return content
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

/**
 * Get character count from content
 */
export function getCharCount(content: string): number {
  return content.length;
}

/**
 * Get reading time estimate (based on average reading speed of 200 words per minute)
 */
export function getReadingTime(content: string): number {
  const wordCount = getWordCount(content);
  return Math.ceil(wordCount / 200);
}
