import { art } from "../art";

/** A snowy hillside village along the bottom of the screen. */
export function Village() {
  return (
    <div className="village" aria-hidden="true">
      <svg className="village__hills" viewBox="0 0 400 90" preserveAspectRatio="none">
        <path className="village__hill village__hill--back" d="M0 50 C 70 20 140 24 210 44 C 270 60 330 26 400 36 V90 H0 Z" />
        <path className="village__hill village__hill--front" d="M0 70 C 90 44 170 56 240 64 C 310 72 350 52 400 58 V90 H0 Z" />
      </svg>
      <img className="village__item village__tree village__tree--1" src={art.evergreenTree} alt="" />
      <img className="village__item village__house" src={art.house} alt="" />
      <img className="village__item village__tree village__tree--2" src={art.christmasTree} alt="" />
      <img className="village__item village__tree village__tree--3" src={art.evergreenTree} alt="" />
      <img className="village__item village__snowman" src={art.snowman} alt="" />
      <img className="village__item village__tree village__tree--4" src={art.evergreenTree} alt="" />
    </div>
  );
}
