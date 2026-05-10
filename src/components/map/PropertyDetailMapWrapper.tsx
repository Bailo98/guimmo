import dynamic from "next/dynamic";

const PropertyDetailMapDynamic = dynamic(
  () => import("./PropertyDetailMap").then((m) => m.PropertyDetailMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[200px] bg-slate-100 dark:bg-[#1e2430] rounded-xl animate-pulse" />
    ),
  }
);

interface Props {
  neighborhood: string;
  isDark?: boolean;
}

export function PropertyDetailMapWrapper({ neighborhood }: Props) {
  return <PropertyDetailMapDynamic neighborhood={neighborhood} />;
}
