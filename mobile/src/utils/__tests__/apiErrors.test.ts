import { AxiosError } from "axios";

import { formatApiError } from "../apiErrors";

describe("formatApiError", () => {
  it("formats FastAPI string detail with status", () => {
    const err = new AxiosError("Request failed");
    err.response = {
      status: 400,
      data: { detail: "Invalid payload." },
      statusText: "Bad Request",
      headers: {},
      config: {} as never,
    };
    expect(formatApiError(err)).toBe("400: Invalid payload.");
  });

  it("joins validation array details", () => {
    const err = new AxiosError("fail");
    err.response = {
      status: 422,
      data: {
        detail: [
          { msg: "field required", loc: ["body", "email"] },
          { msg: "ensure this value has at least 6 characters", loc: ["body", "password"] },
        ],
      },
      statusText: "Unprocessable Entity",
      headers: {},
      config: {} as never,
    };
    const out = formatApiError(err);
    expect(out).toContain("422:");
    expect(out).toContain("field required");
    expect(out).toContain("6 characters");
  });

  it("falls back for non-Axios errors", () => {
    expect(formatApiError(new Error("plain"))).toBe("plain");
    expect(formatApiError("weird")).toBe("Something went wrong.");
  });
});
