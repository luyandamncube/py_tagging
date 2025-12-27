import { ReactNode } from "react";

export default function TagGroupSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3>{title}</h3>
      <div>{children}</div>
    </div>
  );
}
