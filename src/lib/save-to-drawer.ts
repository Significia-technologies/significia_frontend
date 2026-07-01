import httpClient from "@/core/api/http-client";
import { MasterDataService } from "@/core/services/master.service";

/**
 * Fetches a generated report as a blob and saves it directly to the
 * client's drawer vault — no browser download involved.
 */
export async function saveReportToDrawer({
  clientId,
  endpoint,
  fileName,
  documentType,
  category,
  params,
}: {
  clientId: string;
  endpoint: string;
  fileName: string;
  documentType: string;
  category: string;
  params?: Record<string, string>;
}): Promise<void> {
  const response = await httpClient.get(endpoint, {
    responseType: "blob",
    ...(params ? { params } : {}),
  });
  const file = new File(
    [new Blob([response.data], { type: "application/pdf" })],
    fileName,
    { type: "application/pdf" }
  );
  await MasterDataService.addDocument(clientId, file, documentType, category);
}
