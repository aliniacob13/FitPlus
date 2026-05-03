import { AxiosError } from "axios";

type FastApiValidationItem = { msg?: string; loc?: unknown };

/**
 * Human-readable message from axios errors (FastAPI: string | list | object detail).
 */
export const formatApiError = (err: unknown, fallback = "Something went wrong."): string => {
  if (err instanceof AxiosError) {
    const status = err.response?.status;
    const data = err.response?.data as { detail?: unknown } | undefined;
    const detail = data?.detail;

    let body: string;
    if (typeof detail === "string") {
      body = detail;
    } else if (Array.isArray(detail)) {
      body = detail
        .map((item: unknown) => {
          if (typeof item === "object" && item !== null && "msg" in item) {
            return String((item as FastApiValidationItem).msg ?? "");
          }
          return JSON.stringify(item);
        })
        .filter((s) => s.length > 0)
        .join("; ");
      if (!body) {
        body = err.message || fallback;
      }
    } else if (detail !== null && detail !== undefined && typeof detail === "object") {
      body = JSON.stringify(detail);
    } else if (err.message) {
      body = err.message;
    } else {
      body = fallback;
    }

    return status ? `${status}: ${body}` : body;
  }

  if (err instanceof Error) {
    return err.message;
  }

  return fallback;
};
