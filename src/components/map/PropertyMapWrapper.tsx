import dynamic from "next/dynamic";

const PropertyMap = dynamic(
  () => import("./PropertyMap").then((m) => m.PropertyMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[60vh] md:h-[70vh] bg-[#1e2430] rounded-2xl animate-pulse" />
    ),
  }
);

export { PropertyMap as PropertyMapWrapper };
