const FOXIT_BASE = "https://na1.fusion.foxit.com";

function getCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.FOXIT_CLIENT_ID;
  const clientSecret = process.env.FOXIT_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("FOXIT_CLIENT_ID and FOXIT_CLIENT_SECRET must be set");
  }
  return { clientId, clientSecret };
}

function authHeaders(includeBasicAuth = false): Record<string, string> {
  const { clientId, clientSecret } = getCredentials();
  const headers: Record<string, string> = {
    client_id: clientId,
    client_secret: clientSecret,
  };
  if (includeBasicAuth) {
    headers["Authorization"] = "Basic Og==";
  }
  return headers;
}

// Upload a file (HTML or DOCX) to Foxit
export async function uploadDocument(
  fileBuffer: Buffer,
  filename: string
): Promise<string> {
  const formData = new FormData();
  const blob = new Blob([new Uint8Array(fileBuffer)], { type: "application/octet-stream" });
  formData.append("file", blob, filename);

  const res = await fetch(
    `${FOXIT_BASE}/pdf-services/api/documents/upload`,
    {
      method: "POST",
      headers: authHeaders(false),
      body: formData,
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Foxit upload failed ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.documentId;
}

// Convert HTML to PDF
export async function htmlToPdf(documentId: string): Promise<string> {
  // Try PDF creation endpoint (HTML → PDF is classified as "PDF Creation" in Foxit docs)
  const endpoints = [
    `${FOXIT_BASE}/pdf-services/api/documents/${documentId}/to/pdf`,
    `${FOXIT_BASE}/pdf-services/api/documents/${documentId}/create-pdf`,
    `${FOXIT_BASE}/pdf-services/api/documents/${documentId}/convert/pdf`,
  ];

  let lastError = "";
  for (const endpoint of endpoints) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        ...authHeaders(true),
        "Content-Type": "application/json",
      },
    });

    if (res.ok) {
      const data = await res.json();
      return data.taskId;
    }

    const text = await res.text();
    lastError = `${endpoint} → ${res.status}: ${text}`;
    console.error(`[Foxit] Endpoint failed: ${lastError}`);

    // 404 means wrong endpoint, try next; other errors are real failures
    if (res.status !== 404) {
      throw new Error(`Foxit HTML→PDF conversion failed (${res.status}): ${text}`);
    }
  }

  throw new Error(`Foxit HTML→PDF: no working endpoint found. Last: ${lastError}`);
}

// Check task status (polling)
export async function getTaskStatus(
  taskId: string
): Promise<{ status: string; progress: number; resultDocumentId?: string }> {
  const res = await fetch(
    `${FOXIT_BASE}/pdf-services/api/tasks/${taskId}`,
    {
      headers: authHeaders(true),
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
      headers: authHeaders(false),
    }
  );

  if (!res.ok) {
    throw new Error(`Foxit download failed: ${res.status}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Add watermark to a PDF document
export async function addWatermark(
  documentId: string,
  watermarkText: string
): Promise<string> {
  const res = await fetch(
    `${FOXIT_BASE}/pdf-services/api/documents/${documentId}/watermark`,
    {
      method: "POST",
      headers: {
        ...authHeaders(true),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: watermarkText,
        opacity: 0.15,
        rotation: -45,
        fontSize: 48,
        color: "#CCCCCC",
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Foxit watermark failed: ${text}`);
  }

  const data = await res.json();
  return data.taskId;
}

// Compress a PDF document
export async function compressPdf(documentId: string): Promise<string> {
  const res = await fetch(
    `${FOXIT_BASE}/pdf-services/api/documents/${documentId}/compress`,
    {
      method: "POST",
      headers: {
        ...authHeaders(true),
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Foxit compression failed: ${text}`);
  }

  const data = await res.json();
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

  // Step 2: Convert to PDF
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
  return downloadDocument(finalDocId, `CiteFix-Brief-${brandName}.pdf`);
}

// Document Generation API — template-based document creation
export async function generateDocument(
  templateBase64: string,
  documentValues: Record<string, unknown>,
  outputFormat: "pdf" | "docx" = "pdf"
): Promise<Buffer> {
  const res = await fetch(
    `${FOXIT_BASE}/docgen-services/api/documents/generate`,
    {
      method: "POST",
      headers: {
        ...authHeaders(false),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        template: templateBase64,
        documentValues,
        outputFormat,
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Foxit DocGen failed: ${text}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
