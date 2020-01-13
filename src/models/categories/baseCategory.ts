export class GeoLocation {
  private _latitude: number;
  private _longitude: number;

  constructor(latitude: number, longitude: number) {
    this._latitude = latitude;
    this._longitude = longitude;
  }

  public get Latitude(): number {
    return this._latitude;
  }

  public get Longitude(): number {
    return this._longitude;
  }

  public toJSON() {
    return {
      latitude: this._latitude,
      longitude: this._longitude
    };
  }
}
export class Point {
  private _id: string;
  private _name: string;
  private _location: GeoLocation;
  private _distanceMatrixIndex: number;
  private _type: string;
  private _rating: number;

  constructor(id: string, name: string, location: GeoLocation, type: string, rating: number) {
    this._id = id;
    this._name = name;
    this._location = location;
    this._type = type;
    this._rating = rating;
  }

  public get Location(): GeoLocation {
    return this._location;
  }

  public get DistanceMatrixIndex(): number {
    return this._distanceMatrixIndex;
  }

  public set DistanceMatrixIndex(index: number) {
    this._distanceMatrixIndex = index;
  }

  public get ID(): string {
    return this._id;
  }

  public get Name(): string {
    return this._name;
  }

  public get Type(): string {
    return this._type;
  }

  public get Rating(): number {
    return this._rating;
  }

  public toJSON() {
    return {
      id: this._id,
      name: this._name,
      type: this._type,
      location: this._location && this._location.toJSON(),
      rating: this._rating
    };
  }
}

export class CategoryInstance {
  public baseCategory: BaseCategory;
  constructor(baseCategory: BaseCategory) {
    this.baseCategory = baseCategory;
  }
}

export class BaseCategory {
  private _usuallySpentHours: number;
  private _userPreference: number;
  private _name: string;
  private _points: Point[];
  private _maxPointsCount: number;

  constructor(name: string, userPreference: number, usuallySpentHours: number, totalHoursPerDay: number) {
    this._userPreference = userPreference;
    this._usuallySpentHours = usuallySpentHours;
    this._name = name;
    this._points = [];
    this._maxPointsCount = Math.ceil((userPreference * totalHoursPerDay) / usuallySpentHours);
  }

  /**
   * addPoint
   */
  public addPoint(point: Point) {
    this._points.push(point);
  }

  /**
   * getUsuallySpentHoursArray
   */
  public getCategoryInstancesByUsuallySpentHours(selectedPointsCount: number): CategoryInstance[] {
    const arr: CategoryInstance[] = [];

    for (let index = 0; index < this._maxPointsCount - selectedPointsCount; index++) {
      arr.push(new CategoryInstance(this));
    }

    return arr;
  }

  get UserPreference(): number {
    return this._userPreference;
  }

  get UsuallySpentHours(): number {
    return this._usuallySpentHours;
  }

  get Points(): Point[] {
    return this._points;
  }

  get MaxPointsCount(): number {
    return this._maxPointsCount;
  }

  get Name(): string {
    return this._name;
  }
}
