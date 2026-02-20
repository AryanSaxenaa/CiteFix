import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/store";

interface SchemaValidationResult {
  isValid: boolean;
  errors: SchemaError[];
  warnings: SchemaWarning[];
  score: number; // 0-100
  types: string[];
  recommendations: string[];
}

interface SchemaError {
  path: string;
  message: string;
  severity: "error" | "warning";
}

interface SchemaWarning {
  property: string;
  message: string;
  suggestion: string;
}

// Required properties by Schema.org type
const REQUIRED_PROPERTIES: Record<string, string[]> = {
  Article: ["headline", "author", "datePublished", "image", "publisher"],
  NewsArticle: ["headline", "author", "datePublished", "image", "publisher"],
  BlogPosting: ["headline", "author", "datePublished", "mainEntityOfPage"],
  HowTo: ["name", "step"],
  FAQPage: ["mainEntity"],
  Product: ["name", "image", "description", "offers"],
  LocalBusiness: ["name", "address", "telephone"],
  Organization: ["name", "url", "logo"],
  WebPage: ["name", "url"],
  BreadcrumbList: ["itemListElement"],
  VideoObject: ["name", "description", "thumbnailUrl", "uploadDate"],
  Recipe: ["name", "image", "author", "datePublished", "recipeIngredient", "recipeInstructions"],
};

// Recommended (bonus) properties by type
const RECOMMENDED_PROPERTIES: Record<string, string[]> = {
  Article: ["dateModified", "description", "mainEntityOfPage", "wordCount"],
  BlogPosting: ["dateModified", "description", "wordCount", "keywords"],
  Product: ["brand", "sku", "aggregateRating", "review"],
  FAQPage: [],
  HowTo: ["description", "image", "totalTime", "estimatedCost"],
  Organization: ["sameAs", "contactPoint", "description"],
};

/**
 * POST /api/analyze/[jobId]/validate-schema
 *
 * Validates the generated JSON-LD schema markup against Schema.org requirements.
 * Returns detailed validation results with errors, warnings, score and recommendations.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const job = await getJob(jobId);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const schemaMarkup = job.generatedAssets?.schemaMarkup;
  if (!schemaMarkup?.jsonLd) {
    return NextResponse.json(
      { error: "No schema markup available to validate" },
      { status: 400 }
    );
  }

  try {
    const result = validateSchema(schemaMarkup.jsonLd);
    return NextResponse.json({ success: true, validation: result });
  } catch (error) {
    return NextResponse.json(
      { error: "Validation failed", details: String(error) },
      { status: 500 }
    );
  }
}

function validateSchema(jsonLdString: string): SchemaValidationResult {
  const errors: SchemaError[] = [];
  const warnings: SchemaWarning[] = [];
  const recommendations: string[] = [];
  const types: string[] = [];
  let score = 100;

  // Step 1: Parse JSON
  let parsed: Record<string, unknown> | Record<string, unknown>[];
  try {
    parsed = JSON.parse(jsonLdString);
  } catch (e) {
    return {
      isValid: false,
      errors: [{ path: "root", message: `Invalid JSON: ${String(e)}`, severity: "error" }],
      warnings: [],
      score: 0,
      types: [],
      recommendations: ["Fix the JSON syntax errors before proceeding."],
    };
  }

  // Normalize to array
  const schemas = Array.isArray(parsed) ? parsed : [parsed];

  for (let i = 0; i < schemas.length; i++) {
    const schema = schemas[i] as Record<string, unknown>;
    const prefix = schemas.length > 1 ? `[${i}]` : "";

    // Step 2: Check @context
    if (!schema["@context"]) {
      errors.push({
        path: `${prefix}@context`,
        message: "Missing @context — required for valid JSON-LD",
        severity: "error",
      });
      score -= 20;
    } else {
      const ctx = String(schema["@context"]);
      if (!ctx.includes("schema.org")) {
        warnings.push({
          property: `${prefix}@context`,
          message: `@context is "${ctx}" — expected "https://schema.org"`,
          suggestion: 'Use "https://schema.org" as the @context value',
        });
        score -= 5;
      }
    }

    // Step 3: Check @type
    const schemaType = schema["@type"] as string | undefined;
    if (!schemaType) {
      errors.push({
        path: `${prefix}@type`,
        message: "Missing @type — required to identify the schema type",
        severity: "error",
      });
      score -= 20;
    } else {
      types.push(schemaType);

      // Step 4: Check required properties
      const required = REQUIRED_PROPERTIES[schemaType] || [];
      for (const prop of required) {
        if (!schema[prop] && !schema[prop.toLowerCase()]) {
          errors.push({
            path: `${prefix}${prop}`,
            message: `Missing required property "${prop}" for ${schemaType}`,
            severity: "error",
          });
          score -= Math.round(15 / Math.max(required.length, 1));
        }
      }

      // Step 5: Check recommended properties
      const recommended = RECOMMENDED_PROPERTIES[schemaType] || [];
      for (const prop of recommended) {
        if (!schema[prop] && !schema[prop.toLowerCase()]) {
          warnings.push({
            property: `${prefix}${prop}`,
            message: `Missing recommended property "${prop}" for ${schemaType}`,
            suggestion: `Adding "${prop}" improves rich result eligibility`,
          });
          score -= 2;
        }
      }

      // Step 6: Type-specific deep checks
      if (schemaType === "FAQPage" && schema["mainEntity"]) {
        const faqItems = Array.isArray(schema["mainEntity"]) ? schema["mainEntity"] : [];
        if (faqItems.length === 0) {
          errors.push({
            path: `${prefix}mainEntity`,
            message: "FAQPage mainEntity should contain at least one Question",
            severity: "error",
          });
          score -= 10;
        }
        for (let j = 0; j < faqItems.length; j++) {
          const item = faqItems[j] as Record<string, unknown>;
          if (item["@type"] !== "Question") {
            warnings.push({
              property: `${prefix}mainEntity[${j}].@type`,
              message: `FAQ item should have @type "Question", found "${item["@type"]}"`,
              suggestion: 'Set @type to "Question"',
            });
          }
          if (!item["acceptedAnswer"]) {
            errors.push({
              path: `${prefix}mainEntity[${j}].acceptedAnswer`,
              message: "Each FAQ Question must have an acceptedAnswer",
              severity: "error",
            });
            score -= 5;
          }
        }
      }

      if (schemaType === "HowTo" && schema["step"]) {
        const steps = Array.isArray(schema["step"]) ? schema["step"] : [];
        for (let j = 0; j < steps.length; j++) {
          const step = steps[j] as Record<string, unknown>;
          if (!step["text"] && !step["name"]) {
            warnings.push({
              property: `${prefix}step[${j}]`,
              message: "HowTo step should have a 'text' or 'name' property",
              suggestion: "Add descriptive text to each step",
            });
          }
        }
      }

      // Step 7: Check for empty string values
      for (const [key, val] of Object.entries(schema)) {
        if (key.startsWith("@")) continue;
        if (val === "" || val === null) {
          warnings.push({
            property: `${prefix}${key}`,
            message: `Property "${key}" is empty`,
            suggestion: `Provide a meaningful value for "${key}"`,
          });
          score -= 2;
        }
      }
    }
  }

  // Generate recommendations
  if (types.length === 0) {
    recommendations.push("Add at least one valid Schema.org type.");
  }
  if (types.length === 1) {
    recommendations.push(
      "Consider adding supplementary schema types (e.g., BreadcrumbList, Organization) for richer search results."
    );
  }
  if (!types.includes("FAQPage") && !types.includes("HowTo")) {
    recommendations.push(
      "Adding FAQPage or HowTo schema can unlock featured snippet eligibility in AI engines."
    );
  }
  if (errors.length === 0 && warnings.length === 0) {
    recommendations.push("Schema looks great! Deploy it and monitor Google Search Console for rich results.");
  }

  return {
    isValid: errors.filter((e) => e.severity === "error").length === 0,
    errors,
    warnings,
    score: Math.max(0, Math.min(100, score)),
    types,
    recommendations,
  };
}
