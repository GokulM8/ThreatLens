export interface TabDef<T extends string> {
  id: T;
  label: string;
}

interface TabBarProps<T extends string> {
  tabs: TabDef<T>[];
  activeTab: T;
  onChange: (tab: T) => void;
}

export default function TabBar<T extends string>({ tabs, activeTab, onChange }: TabBarProps<T>) {
  return (
    <div className="inline-flex w-fit overflow-hidden rounded-[10px] border border-hair border-border bg-card">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className="px-4 py-2 text-xs transition-colors"
          style={{
            backgroundColor: activeTab === tab.id ? "#111111" : "#ffffff",
            color: activeTab === tab.id ? "#ffffff" : "#aaaaaa",
            fontWeight: activeTab === tab.id ? 600 : 400,
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
