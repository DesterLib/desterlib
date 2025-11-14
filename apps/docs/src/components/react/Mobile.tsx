import homeScreen from "../../assets/mobile/s-home.png";
import iphoneFrame from "../../assets/mobile/f-iphone.png";

const Mobile = () => {
  return (
    <div>
      <svg
        width="200"
        height="auto"
        viewBox="0 0 418 850"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        className="w-full h-auto max-w-full"
      >
        <rect
          x="19.6924"
          y="19.2693"
          width="375"
          height="812"
          fill="url(#pattern0_1890_38)"
        />
        <rect width="417.308" height="848.077" fill="url(#pattern1_1890_38)" />
        <defs>
          <pattern
            id="pattern0_1890_38"
            patternContentUnits="objectBoundingBox"
            width="1"
            height="1"
          >
            <use
              xlinkHref="#image0_1890_38"
              transform="scale(0.00133333 0.000615764)"
            />
          </pattern>
          <pattern
            id="pattern1_1890_38"
            patternContentUnits="objectBoundingBox"
            width="1"
            height="1"
          >
            <use
              xlinkHref="#image1_1890_38"
              transform="scale(0.000576037 0.000283447)"
            />
          </pattern>
          <image
            id="image0_1890_38"
            width="750"
            height="1624"
            preserveAspectRatio="none"
            xlinkHref={homeScreen.src}
          />
          <image
            id="image1_1890_38"
            width="1736"
            height="3528"
            preserveAspectRatio="none"
            xlinkHref={iphoneFrame.src}
          />
        </defs>
      </svg>
    </div>
  );
};

export default Mobile;
