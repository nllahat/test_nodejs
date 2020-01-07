import { UsuallySpentPerCategory } from "../models/tripSettings";

export class Constants {
  static readonly USUALLY_SPENT: UsuallySpentPerCategory = {
    default: 1.5,
    museums: 2,
    shopping: 1,
    sights: 1,
    parks: 1.5
  };
  static readonly MAIN_ACTIVITIES_PER_DAY = 2;
  static readonly OTHER_ACTIVITIES_PER_DAY = 1;
  static readonly SPENT_HOURS_PER_DAY = 8;
  static readonly DAY_PART_ONE_HOURS = 3;
  static readonly DAY_PART_TWO_HOURS = 5;
}
