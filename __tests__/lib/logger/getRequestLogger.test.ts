/**
 * @jest-environment node
 */
import { headers } from "next/headers";
import { logger } from "@/lib/logger";
import { getRequestLogger } from "@/lib/logger/getRequestLogger";

jest.mock("next/headers", () => ({ headers: jest.fn() }));

const headersMock = headers as jest.MockedFunction<typeof headers>;

afterEach(() => {
  jest.restoreAllMocks();
  headersMock.mockReset();
});

describe("getRequestLogger", () => {
  it("binds the request ID when the header is present", async () => {
    headersMock.mockResolvedValue(new Headers({ "x-request-id": "id-1" }) as never);
    const child = jest.spyOn(logger, "child");
    const log = await getRequestLogger();
    expect(child).toHaveBeenCalledWith({ requestId: "id-1" });
    expect(log).toBe(child.mock.results[0].value);
  });

  it("returns the plain logger when the header is missing", async () => {
    headersMock.mockResolvedValue(new Headers() as never);
    await expect(getRequestLogger()).resolves.toBe(logger);
  });

  it("returns the plain logger outside a request", async () => {
    headersMock.mockImplementation(() => {
      throw new Error("`headers` was called outside a request scope.");
    });
    await expect(getRequestLogger()).resolves.toBe(logger);
  });
});
