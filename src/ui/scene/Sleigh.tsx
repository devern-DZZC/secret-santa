import { art } from "../art";

/** Santa's sleigh and three reindeer gallop across the sky, trailing sparkles. */
export function Sleigh() {
  return (
    <div className="sleigh" aria-hidden="true">
      <div className="sleigh__team">
        <div className="sleigh__bob">
          <img className="sleigh__deer" src={art.deer} alt="" />
          <img className="sleigh__deer" src={art.deer} alt="" />
          <img className="sleigh__deer" src={art.deer} alt="" />
          <span className="sleigh__reins" />
          <span className="sleigh__ride">
            <img className="sleigh__santa" src={art.santa} alt="" />
            <img className="sleigh__sled" src={art.sled} alt="" />
          </span>
          <span className="sleigh__trail" />
        </div>
      </div>
    </div>
  );
}
