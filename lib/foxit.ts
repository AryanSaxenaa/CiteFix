const FOXIT_BASE = "https://na1.fusion.foxit.com";

// PDF Services credentials
function getPdfCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.FOXIT_CLIENT_ID;
  const clientSecret = process.env.FOXIT_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("FOXIT_CLIENT_ID and FOXIT_CLIENT_SECRET must be set");
  }
  return { clientId, clientSecret };
}

// Document Generation credentials (separate keys)
function getDocGenCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.FOXIT_DOCGEN_CLIENT_ID;
  const clientSecret = process.env.FOXIT_DOCGEN_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("FOXIT_DOCGEN_CLIENT_ID and FOXIT_DOCGEN_CLIENT_SECRET must be set");
  }
  return { clientId, clientSecret };
}

function pdfAuthHeaders(includeBasicAuth = false): Record<string, string> {
  const { clientId, clientSecret } = getPdfCredentials();
  const headers: Record<string, string> = {
    client_id: clientId,
    client_secret: clientSecret,
  };
  if (includeBasicAuth) {
    headers["Authorization"] = "Basic Og==";
  }
  return headers;
}

function docGenAuthHeaders(): Record<string, string> {
  const { clientId, clientSecret } = getDocGenCredentials();
  return {
    client_id: clientId,
    client_secret: clientSecret,
  };
}

// Upload a file (HTML or DOCX) to Foxit
export async function uploadDocument(
  fileBuffer: Buffer,
  filename: string
): Promise<string> {
  const formData = new FormData();
  const blob = new Blob([new Uint8Array(fileBuffer)], { type: "application/octet-stream" });
  formData.append("file", blob, filename);

  console.log(`[Foxit] Uploading ${filename} (${fileBuffer.length} bytes)...`);

  // Try without Basic Auth first (per docs), then with Basic Auth as fallback
  for (const useBasicAuth of [false, true]) {
    try {
      const headers = pdfAuthHeaders(useBasicAuth);
      const res = await fetch(
        `${FOXIT_BASE}/pdf-services/api/documents/upload`,
        {
          method: "POST",
          headers,
          body: formData,
        }
      );

      if (res.ok) {
        const data = await res.json();
        console.log(`[Foxit] Upload successful: documentId=${data.documentId} (basicAuth=${useBasicAuth})`);
        return data.documentId;
      }

      const text = await res.text();
      console.error(`[Foxit] Upload attempt (basicAuth=${useBasicAuth}) failed ${res.status}: ${text}`);
      
      // If 401, try the other auth method
      if (res.status === 401) continue;
      
      // Other errors are real failures
      throw new Error(`Foxit upload failed ${res.status}: ${text}`);
    } catch (err) {
      if (useBasicAuth) throw err; // Both methods failed
      console.error(`[Foxit] Upload attempt failed, trying with Basic Auth...`);
    }
  }

  throw new Error("Foxit upload failed: all auth methods exhausted");
}

// Convert uploaded HTML document to PDF
// Docs: POST /pdf-services/api/documents/create/pdf-from-html
export async function htmlToPdf(documentId: string): Promise<string> {
  const endpoint = `${FOXIT_BASE}/pdf-services/api/documents/create/pdf-from-html`;

  console.log(`[Foxit] Converting HTML→PDF via ${endpoint}...`);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      ...pdfAuthHeaders(false),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      documentId,
      config: {
        dimension: { width: 612, height: 792 },
        rotation: "NONE",
        pageMode: "MULTIPLE_PAGE",
        scalingMode: "SCALE",
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[Foxit] HTML→PDF failed ${res.status}: ${text}`);
    throw new Error(`Foxit HTML→PDF failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  console.log(`[Foxit] HTML→PDF task created: ${data.taskId}`);
  return data.taskId;
}

// Check task status (polling)
// Docs: GET /pdf-services/api/tasks/:task-id
export async function getTaskStatus(
  taskId: string
): Promise<{ status: string; progress: number; resultDocumentId?: string }> {
  const res = await fetch(
    `${FOXIT_BASE}/pdf-services/api/tasks/${taskId}`,
    {
      headers: pdfAuthHeaders(false),
    }
  );

  if (!res.ok) {
    throw new Error(`Foxit task status check failed: ${res.status}`);
  }

  return res.json();
}

// Wait for task completion with polling
export async function waitForTask(
  taskId: string,
  maxWaitMs: number = 30000
): Promise<string> {
  const start = Date.now();

  while (Date.now() - start < maxWaitMs) {
    const status = await getTaskStatus(taskId);

    if (status.status === "COMPLETED" && status.resultDocumentId) {
      return status.resultDocumentId;
    }
    if (status.status === "FAILED") {
      throw new Error("Foxit task failed");
    }

    await new Promise((r) => setTimeout(r, 1000));
  }

  throw new Error("Foxit task timed out");
}

// Download processed document
export async function downloadDocument(
  documentId: string,
  filename?: string
): Promise<Buffer> {
  const params = filename ? `?filename=${encodeURIComponent(filename)}` : "";
  const res = await fetch(
    `${FOXIT_BASE}/pdf-services/api/documents/${documentId}/download${params}`,
    {
      headers: pdfAuthHeaders(false),
    }
  );

  if (!res.ok) {
    throw new Error(`Foxit download failed: ${res.status}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Add watermark to a PDF document
// Docs pattern: POST /pdf-services/api/documents/enhance/... with documentId in body
export async function addWatermark(
  documentId: string,
  watermarkText: string
): Promise<string> {
  const endpoint = `${FOXIT_BASE}/pdf-services/api/documents/enhance/pdf-watermark`;
  console.log(`[Foxit] Adding watermark via ${endpoint}...`);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      ...pdfAuthHeaders(false),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      documentId,
      config: {
        text: watermarkText,
        opacity: 15,
        rotation: -45,
        fontSize: 48,
        color: "#CCCCCC",
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[Foxit] Watermark failed ${res.status}: ${text}`);
    throw new Error(`Foxit watermark failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  console.log(`[Foxit] Watermark task created: ${data.taskId}`);
  return data.taskId;
}

// Compress a PDF document
// Docs pattern: POST /pdf-services/api/documents/modify/pdf-compress with documentId in body
export async function compressPdf(documentId: string): Promise<string> {
  const endpoint = `${FOXIT_BASE}/pdf-services/api/documents/modify/pdf-compress`;
  console.log(`[Foxit] Compressing PDF via ${endpoint}...`);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      ...pdfAuthHeaders(false),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      documentId,
      config: {
        compressionLevel: "MEDIUM",
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[Foxit] Compress failed ${res.status}: ${text}`);
    throw new Error(`Foxit compression failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  console.log(`[Foxit] Compress task created: ${data.taskId}`);
  return data.taskId;
}

// Full pipeline: HTML → upload → convert → watermark → compress → download
export async function generatePdfFromHtml(
  htmlContent: string,
  brandName: string
): Promise<Buffer> {
  // Step 1: Upload HTML
  const htmlBuffer = Buffer.from(htmlContent, "utf-8");
  const uploadedId = await uploadDocument(htmlBuffer, "brief.html");

  // Step 2: Convert HTML to PDF
  const convertTaskId = await htmlToPdf(uploadedId);
  const pdfDocId = await waitForTask(convertTaskId);

  // Step 3: Add watermark
  let finalDocId = pdfDocId;
  try {
    const watermarkTaskId = await addWatermark(pdfDocId, `${brandName} — Confidential`);
    finalDocId = await waitForTask(watermarkTaskId);
  } catch {
    // Watermark is non-critical, continue with unwatermarked PDF
  }

  // Step 4: Compress
  try {
    const compressTaskId = await compressPdf(finalDocId);
    finalDocId = await waitForTask(compressTaskId);
  } catch {
    // Compression is non-critical
  }

  // Step 5: Download
  return downloadDocument(finalDocId, `Scoutlytics-Brief-${brandName}.pdf`);
}

// Document Generation API — template-based document creation
// Docs: POST /document-generation/api/GenerateDocumentBase64
// Requires a .docx template with {{tags}}, returns JSON with base64FileString
export async function generateDocument(
  templateBase64: string,
  documentValues: Record<string, unknown>,
  outputFormat: "PDF" | "DOCX" = "PDF"
): Promise<Buffer> {
  const endpoint = `${FOXIT_BASE}/document-generation/api/GenerateDocumentBase64`;

  console.log(`[Foxit] DocGen: generating ${outputFormat} via ${endpoint}...`);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      ...docGenAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      base64FileString: templateBase64,
      documentValues,
      outputFormat,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[Foxit] DocGen failed ${res.status}: ${text}`);
    throw new Error(`Foxit DocGen failed (${res.status}): ${text}`);
  }

  // Response is JSON with { message, fileExtension, base64FileString }
  const data = await res.json();
  console.log(`[Foxit] DocGen success: ${data.message}, ext=${data.fileExtension}`);

  if (!data.base64FileString) {
    throw new Error("Foxit DocGen returned no file data");
  }

  return Buffer.from(data.base64FileString, "base64");
}
