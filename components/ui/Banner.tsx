interface BannerProps {
  title: string;
  image: string; // new prop
}

export default function Banner({ title, image }: BannerProps) {
  return (
    <div
      className="banner-inner mt-15"
      style={{ background: `url(${image})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      <div className="content-inner">
        <h3 className="textwhite align-center">{title}</h3>
      </div>
    </div>
  );
}
