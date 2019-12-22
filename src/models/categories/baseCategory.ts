
class GeoLocation {
    private latitude: number;
    private longitude: number;
}
export class Point {
    private _id: string;
    private _name: string;
    private _location: GeoLocation;

    constructor (id: string, name: string, location: GeoLocation) {
        this._id = id;
        this._name = name;
        this._location = location;
    }
}
export class BaseCategory {
  private _usuallySpentHours: number;
  private _userPreference: number;
  private _name: string;
  private _points: Point[];

  constructor(name: string, userPreference: number, usuallySpentHours: number) {
    this._userPreference = userPreference;
    this._usuallySpentHours = usuallySpentHours;
    this._name = name;
    this._points = [];
  }

  /**
   * addPoint
   */
  public addPoint(point: Point) {
    this._points.push(point);
  }

  get UserPreference(): number {
    return this._userPreference;
  }

  get UsuallySpentHours(): number {
    return this._usuallySpentHours;
  }
}
