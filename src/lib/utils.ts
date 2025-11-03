import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Template variable replacements for legal documents
const TEMPLATE_VARS: Record<string, string> = {
  "{APP_NAME}": "RetroForge",
  "{APP_URL}": "https://retroforge.nlaak.com",
  "{APP_EMAIL_PRIVACY}": "nlaakstudios@pm.me",
  "{APP_EMAIL_LEGAL}": "nlaakstudios@pm.me",
  "{APP_EMAIL_DMCA}": "nlaakstudios@pm.me",
  "{COMPANY_NAME}": "Nlaak Studios",
  "{COMPANY_COPYRIGHT}": "Nlaak Studios",
}

/**
 * Recursively parses template variables in an object
 */
export function parseTemplateVars<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj === "string") {
    let result: string = obj
    for (const [key, value] of Object.entries(TEMPLATE_VARS)) {
      result = result.replace(new RegExp(key.replace(/[{}]/g, "\\$&"), "g"), value)
    }
    return result as unknown as T
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => parseTemplateVars(item)) as unknown as T
  }

  if (typeof obj === "object") {
    const parsed: any = {}
    for (const [key, value] of Object.entries(obj)) {
      parsed[key] = parseTemplateVars(value)
    }
    return parsed as T
  }

  return obj
}

