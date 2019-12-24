import { UsuallySpentPerCategory } from "../models/tripSettings";

export class Constants {
  static readonly USUALLY_SPENT: UsuallySpentPerCategory = {
    default: 1.5,
    museums: 2,
    shopping: 3,
    sights: 1.5
  };
  static readonly MAIN_ACTIVITIES_PER_DAY = 2;
  static readonly OTHER_ACTIVITIES_PER_DAY = 1;
  static readonly SPENT_HOURS_PER_DAY = 8;
}
