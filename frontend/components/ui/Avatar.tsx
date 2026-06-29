interface AvatarProps {
  label: string;
  size?: number;
  shape?: "circle" | "square";
  color?: string;
}

export default function Avatar({ label, size = 32, shape = "circle", color = "#1D9E75" }: AvatarProps) {
  return (
    <div
      className="flex shrink-0 items-center justify-center font-semibold"
      style={{
        width: size,
        height: size,
        borderRadius: shape === "circle" ? "50%" : "8px",
        backgroundColor: "#041a14",
        border: `1.5px solid ${color}`,
        color,
        fontSize: size <= 28 ? "9px" : "11px",
      }}
    >
      {label}
    </div>
  );
}
