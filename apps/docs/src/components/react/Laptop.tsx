import homeScreen from "../../assets/laptop/s-home.png";
import macbookFrame from "../../assets/laptop/f-macbook.png";

const Laptop = () => {
  return (
    <div>
      <svg
        width="1000"
        viewBox="0 0 1972 1282"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto max-w-full"
      >
        <rect
          width="1512"
          height="982"
          transform="translate(230 150)"
          fill="#808080"
        />
        <rect
          width="1512"
          height="982"
          transform="translate(230 150)"
          fill="url(#pattern0_22_185)"
        />
        <rect width="1972" height="1282" fill="url(#pattern1_22_185)" />
        <defs>
          <pattern
            id="pattern0_22_185"
            patternContentUnits="objectBoundingBox"
            width="1"
            height="1"
          >
            <use
              xlinkHref="#image0_22_185"
              transform="matrix(0.000496032 0 0 0.000763747 0 -0.654786)"
            />
          </pattern>
          <pattern
            id="pattern1_22_185"
            patternContentUnits="objectBoundingBox"
            width="1"
            height="1"
          >
            <use
              xlinkHref="#image1_22_185"
              transform="scale(0.00025355 0.000390016)"
            />
          </pattern>
          <image
            id="image0_22_185"
            width="2016"
            height="3024"
            xlinkHref={homeScreen.src}
          />
          <image
            id="image1_22_185"
            width="3944"
            height="2564"
            preserveAspectRatio="none"
            xlinkHref={macbookFrame.src}
          />
        </defs>
      </svg>
    </div>
  );
};

export default Laptop;
