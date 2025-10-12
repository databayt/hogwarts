import Image from "next/image";

interface Props {
  coverUrl: string;
  coverColor: string;
  title: string;
}

export default function BookCover({ coverUrl, coverColor, title }: Props) {
  return (
    <div
      className="book-cover-wrapper"
      style={{ backgroundColor: coverColor }}
    >
      <Image
        src={coverUrl}
        alt={title}
        width={400}
        height={600}
        className="book-cover-detail-image"
        priority
      />
    </div>
  );
}
