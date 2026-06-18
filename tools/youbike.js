import { z } from "zod";  
import { defineTool } from "../utils/func-tool.js";  
  
const YOUBIKE_API = "https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json";  
  
async function getYoubikeByArea({ area, available_amount = 0, limit = 3 }) {  
  const res = await fetch(YOUBIKE_API);  
  const data = await res.json();  
  
  return data  
    .filter((s) => s.act === "1" && s.sarea === area) // 根據行政區名稱篩選  
    .map((s) => ({  
      name: s.sna.replace(/^YouBike2\.0_/, ""),  
      area: s.sarea,  
      address: s.ar,  
      available_rent: s.available_rent_bikes,  
      available_return: s.available_return_bikes,  
      total: s.Quantity,  
    }))  
    .filter((s) => s.available_rent >= available_amount) // 篩選至少可租借車輛數  
    .slice(0, limit); // 限制回傳筆數  
}  
  
export const youbikeTool = defineTool({  
  name: "get_youbike_by_area",  
  description: "根據台北市的行政區名稱取得可租借的 YouBike 站點",  
  fn: getYoubikeByArea,  
  parameters: z.object({  
    area: z.string().describe("台北市的行政區名稱，例如大安區、信義區"),  
    available_amount: z  
      .number()  
      .default(0)  
      .describe("至少可租借車輛數，預設 0"),  
    limit: z.number().default(3).describe("回傳筆數上限，預設 3"),  
  }),  
}); 