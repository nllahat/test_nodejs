import { UsuallySpentPerCategory } from "../models/tripSettings";

export class Constants {
  static readonly USUALLY_SPENT: UsuallySpentPerCategory = {
    museums: 2,
    shopping: 3,
    sights: 1.5
  };
  static readonly MAIN_ACTIVITIES_PER_DAY = 2;
  static readonly SPENT_HOURS_PER_DAY = 8;
}
