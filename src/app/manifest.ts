import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "摇一摇决策器",
    short_name: "摇一摇",
    description: "选择困难？摇一下就好 — 基于手机陀螺仪+AI的决策辅助工具",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0f",
    theme_color: "#4f46e5",
    icons: [
      {
        src: "/favicon.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
