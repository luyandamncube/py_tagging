interface Props {
  contentId: string;
}

export default function ValidationBanner({ contentId }: Props) {
  return (
    <div style={{ marginTop: 20, fontSize: 12, opacity: 0.7 }}>
      Validation for content: {contentId}
    </div>
  );
}
