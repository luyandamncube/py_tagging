// import "./right-panel.css";

// type Props = {
//   children?: React.ReactNode;
// };

// export default function RightPanel({ children }: Props) {
//   // If nothing is provided by the route, render nothing
//   if (!children) return null;

//   return (
//     <aside className="right-panel">
//       {children}
//     </aside>
//   );
// }
import "./right-panel.css";

export default function RightPanel({
  children,
}: {
  children: React.ReactNode;
}) {
  return <aside className="right-panel">{children}</aside>;
}
