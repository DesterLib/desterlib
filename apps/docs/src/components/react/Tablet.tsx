import homeScreen from "../../assets/tablet/s-home.png";
import tabletFrame from "../../assets/tablet/f-ipad.png";

const Tablet = () => {
  return (
    <div>
      <svg
        width="600"
        viewBox="0 0 1305 945"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto max-w-full"
      >
        <rect
          width="1194"
          height="834"
          transform="translate(55.5 55.5)"
          fill="#808080"
        />
        <rect
          width="1194"
          height="834"
          transform="translate(55.5 55.5)"
          fill="url(#pattern0_24_406)"
        />
        <rect width="1305" height="945" fill="url(#pattern1_24_406)" />
        <defs>
          <pattern
            id="pattern0_24_406"
            patternContentUnits="objectBoundingBox"
            width="1"
            height="1"
          >
            <use
              xlinkHref="#image0_24_406"
              transform="matrix(0.000558347 0 0 0.000799361 0 -0.454436)"
            />
          </pattern>
          <pattern
            id="pattern1_24_406"
            patternContentUnits="objectBoundingBox"
            width="1"
            height="1"
          >
            <use
              xlinkHref="#image1_24_406"
              transform="scale(0.000383142 0.000529101)"
            />
          </pattern>
          <image
            id="image0_24_406"
            width="1791"
            height="2388"
            xlinkHref={homeScreen.src}
          />
          <image
            id="image1_24_406"
            width="2610"
            height="1890"
            preserveAspectRatio="none"
            xlinkHref={tabletFrame.src}
          />
        </defs>
      </svg>
    </div>
  );
};

export default Tablet;
