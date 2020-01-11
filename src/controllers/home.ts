import { Request, Response, NextFunction } from "express";
import { TripSettings } from "../models/tripSettings";
import * as GoogleMaps from "@google/maps";
import { DistanceMatrix } from "../models/distanceMatrix";
import { Trip, TripDay } from "../models/trip";
import { TripConfigurations, CategoriesMap } from "../models/tripConfigurations";
import { Constants } from "../config/constants";
import { BaseCategory, Point, GeoLocation, CategoryInstance } from "../models/categories/baseCategory";
import * as googleData from "../data.json";

const cacheMatrix: DistanceMatrix = new DistanceMatrix(40);
cacheMatrix.manuallySetMatrix();
const googleMapsClient = GoogleMaps.createClient({
  Promise: Promise,
  key: ""
});

/**
 * GET /
 * Home page.
 */
export const index = (req: Request, res: Response) => {
  res.render("home", {
    title: "Home"
  });
};

interface BodyCategoryPreferences {
  [key: string]: number;
}

function checkDistance(arrA: Point[], arrB: Point[], distanceMatrix: DistanceMatrix, usageMap: {}): number {
  let minDistance = 2000; // 5 km
  let toIndex = -1;

  if (!arrA.length) {
    for (let j = 0; j < arrB.length; j++) {
      if (!usageMap[arrB[j].ID]) {
        return j;
      }
    }

    return -1;
  }

  for (let i = 0; i < arrA.length; i++) {
    for (let j = 0; j < arrB.length; j++) {
      if (
        arrA[i].ID !== arrB[j].ID &&
        !usageMap[arrB[j].ID] &&
        distanceMatrix.matrix[arrA[i].DistanceMatrixIndex][arrB[j].DistanceMatrixIndex] < minDistance
      ) {
        toIndex = j;
        minDistance = distanceMatrix.matrix[arrA[i].DistanceMatrixIndex][arrB[j].DistanceMatrixIndex];
      }
    }
  }

  console.log("from points:", arrA.map(point => point.Name).join(", "));
  console.log(`the selected point is: ${arrB[toIndex].Name}. Distance: ${minDistance}`);

  return toIndex;
}

function buildCategoryPreferencesMap(bodyCategoryPreferences: BodyCategoryPreferences, spentHoursPerDay: number): CategoriesMap {
  const categoryPreferences: CategoriesMap = {};
  const totalPrefPoint = Object.keys(bodyCategoryPreferences).reduce(
    (accumulator: number, currentKey: string) => accumulator + bodyCategoryPreferences[currentKey],
    0
  );

  Object.keys(bodyCategoryPreferences).forEach((key: string) => {
    categoryPreferences[key] = new BaseCategory(
      key,
      bodyCategoryPreferences[key] / totalPrefPoint,
      Constants.USUALLY_SPENT[key] || Constants.USUALLY_SPENT["default"],
      spentHoursPerDay
    );
  });

  return categoryPreferences;
}

async function getPointsByCategory(tripConfigurations: TripConfigurations, tripSettings: TripSettings) {
  const promises: Array<GoogleMaps.PlaceSearchResult[]> = [];

  Object.keys(tripConfigurations.CategoryPreferences).forEach(categoryName => {
    /* promises.push(
      googleMapsClient
        .places({
          query: categoryName + " " + tripSettings.City
        })
        .asPromise()
    ); */
    promises.push(googleData[categoryName]);
  });

  // const searchPlacesResults: Array<GoogleMaps.ClientResponse<GoogleMaps.PlaceSearchResponse>> = await Promise.all(promises);
  const searchPlacesResults: Array<GoogleMaps.PlaceSearchResult[]> = promises;

  for (let index = 0; index < Object.keys(tripConfigurations.CategoryPreferences).length; index++) {
    for (let resultIndex = 0; resultIndex < searchPlacesResults[index].length; resultIndex++) {
      const googlePoint = searchPlacesResults[index][resultIndex];
      const point: Point = new Point(
        googlePoint.place_id,
        googlePoint.name,
        new GeoLocation(googlePoint.geometry.location.lat, googlePoint.geometry.location.lng)
      );

      tripConfigurations.CategoryPreferences[Object.keys(tripConfigurations.CategoryPreferences)[index]].addPoint(point);
    }
  }

  /* for (let index = 0; index < Object.keys(tripConfigurations.CategoryPreferences).length; index++) {
    for (let resultIndex = 0; resultIndex < searchPlacesResults[index].json.results.length; resultIndex++) {
      const googlePoint = searchPlacesResults[index].json.results[resultIndex];
      const point: Point = new Point(
        googlePoint.place_id,
        googlePoint.name,
        new GeoLocation(googlePoint.geometry.location.lat, googlePoint.geometry.location.lng)
      );

      tripConfigurations.CategoryPreferences[Object.keys(tripConfigurations.CategoryPreferences)[index]].addPoint(point);
    }
  } */
}

async function fillDistanceMatrixByPoint(numberOfChunks: number, maxTo: number, points: Point[], distanceMatrix: DistanceMatrix) {
  /* for (let i = 0; i < numberOfChunks; i++) {
    const fromIIndex = i * maxTo;
    const first: Point[] = points.slice(fromIIndex, fromIIndex + maxTo);
    const fromStrArr = first.map(point => [point.Location.Latitude, point.Location.Longitude].join(","));
    const fromPointsStr: GoogleMaps.LatLng[] = [fromStrArr.join("|")];

    for (let j = i; j < numberOfChunks; j++) {
      const fromJIndex = j * maxTo;
      const second = points.slice(fromJIndex, fromJIndex + maxTo);
      const toStrArr = second.map(point => [point.Location.Latitude, point.Location.Longitude].join(","));
      const toPointsStr: GoogleMaps.LatLng[] = [toStrArr.join("|")];

      const result: GoogleMaps.ClientResponse<GoogleMaps.DistanceMatrixResponse> = await googleMapsClient
        .distanceMatrix({
          mode: "walking",
          origins: fromPointsStr,
          destinations: toPointsStr,
          units: "metric"
        })
        .asPromise();

      for (let fromIndex = 0; fromIndex < first.length; fromIndex++) {
        for (let toIndex = 0; toIndex < second.length; toIndex++) {
          distanceMatrix.addEdge(
            fromIndex + fromIIndex,
            toIndex + fromJIndex,
            result.json.rows[fromIndex].elements[toIndex].distance.value
          );
        }
      }
    }
  } */

  for (let pointIndex = 0; pointIndex < points.length; pointIndex++) {
    points[pointIndex].DistanceMatrixIndex = pointIndex;
  }
}

function uniqueCombination(
  l: number,
  sum: number,
  K: number,
  local: CategoryInstance[],
  arr: CategoryInstance[],
  totalResults: CategoryInstance[][]
) {
  // If a unique combination is found
  if (sum == K) {
    totalResults.push([...local]);

    return;
  }

  // For all other combinations
  for (let i = l; i < arr.length; i++) {
    // Check if the sum exceeds K
    if (sum + arr[i].baseCategory.UsuallySpentHours > K) {
      continue;
    }

    // Check if it is repeated or not
    if (i && arr[i].baseCategory.UsuallySpentHours == arr[i - 1].baseCategory.UsuallySpentHours && i > l) {
      continue;
    }

    // Take the element into the combination
    local.push(arr[i]);

    // Recursive call
    uniqueCombination(i + 1, sum + arr[i].baseCategory.UsuallySpentHours, K, local, arr, totalResults);

    // Remove element from the combination
    local.pop();
  }
}

function sortCategoriesByUsuallySpentHours(arr: CategoryInstance[]) {
  function swap(indexA: number, indexB: number) {
    const temp = arr[indexA];
    arr[indexA] = arr[indexB];
    arr[indexB] = temp;
  }

  for (let i = 0; i < arr.length - 1; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      const category = arr[i];
      const nextCategory = arr[j];

      if (category.baseCategory.UsuallySpentHours > nextCategory.baseCategory.UsuallySpentHours) {
        swap(i, j);
      }
    }
  }
}

// Function to find all combination
// of the given elements
function combination(arr: CategoryInstance[], K: number): CategoryInstance[][] {
  sortCategoriesByUsuallySpentHours(arr);
  const allResults = [];

  for (let index = 0; index < K; ) {
    const local = [];
    const totalResults = [];

    uniqueCombination(0, 0, K - index, local, arr, totalResults);

    if (totalResults.length) {
      for (const result of totalResults) {
        allResults.push(result);
      }
    }

    index += 0.5;
  }

  return allResults;
}

function getCombinationOptions(categoryPreferences: CategoriesMap): CategoryInstance[] {
  const arr: CategoryInstance[] = [];

  Object.keys(categoryPreferences).forEach(categoryKey => {
    arr.push(...categoryPreferences[categoryKey].getCategoryInstancesByUsuallySpentHours());
  });

  return arr;
}

function rateCombinations(combinations: CategoryInstance[][]): number[] {
  function getRatingProps(arr: CategoryInstance[]): any {
    const ratings = {
      uniqueness: 0,
      duration: 0
    };
    const uniqueMap = {};
    let totalDurations = 0;

    arr.forEach(element => {
      uniqueMap[element.baseCategory.Name] = true;
      totalDurations += element.baseCategory.UsuallySpentHours;
    });

    ratings.uniqueness = Object.keys(uniqueMap).length * 10;
    ratings.duration = totalDurations;

    return ratings;
  }

  const ratings = [];

  for (let i = 0; i < combinations.length; i++) {
    const combination = combinations[i];
    const rating = getRatingProps(combination);

    ratings.push(rating.uniqueness + rating.duration);
  }

  return ratings;
}

function initCategoryCounter(categoryPreferences: CategoriesMap): void {
  Object.keys(categoryPreferences).forEach(key => {
    categoryPreferences[key].initSelectedPointCount();
  });
}

export const getActivities = async (req: Request, res: Response, next: NextFunction) => {
  const maxLocations = 20;
  const maxTo = Math.floor(maxLocations / 2);
  const bodyCategoryPreferences: BodyCategoryPreferences = req.body.categoryPreferences;
  const bodyTripSettings = req.body.tripSettings;
  const tripSettings: TripSettings = new TripSettings(bodyTripSettings.days, bodyTripSettings.city);
  const categoryPreferences: CategoriesMap = buildCategoryPreferencesMap(bodyCategoryPreferences, tripSettings.SpentHoursPerDay);
  const tripConfigurations: TripConfigurations = new TripConfigurations(categoryPreferences);

  try {
    await getPointsByCategory(tripConfigurations, tripSettings);
    const points: Point[] = tripConfigurations.getAllPoints();
    const numberOfChunks = Math.ceil(points.length / maxTo);
    const distanceMatrix = cacheMatrix; //new DistanceMatrix(points.length);
    await fillDistanceMatrixByPoint(numberOfChunks, maxTo, points, distanceMatrix);
    const trip: Trip = new Trip(tripSettings.Days);

    for (let index = 0; index < trip.days.length; index++) {
      trip.days[index] = new TripDay(tripSettings.PartOneHours, tripSettings.PartTwoHours);
      let arr: CategoryInstance[] = getCombinationOptions(categoryPreferences);

      const resultsPartOne = combination(arr, tripSettings.PartOneHours);
      const partOneResultsRatings: number[] = rateCombinations(resultsPartOne);
      const maxRatingIndexPartOne = partOneResultsRatings.indexOf(Math.max(...partOneResultsRatings));

      for (
        let categoryInstanceIndex = 0;
        categoryInstanceIndex < resultsPartOne[maxRatingIndexPartOne].length;
        categoryInstanceIndex++
      ) {
        const categoryInstance: CategoryInstance = resultsPartOne[maxRatingIndexPartOne][categoryInstanceIndex];

        if (categoryInstance.baseCategory.Points && categoryInstance.baseCategory.Points.length) {
          const selectedIndex = checkDistance(
            trip.days[index].partOnePoints,
            categoryInstance.baseCategory.Points,
            distanceMatrix,
            trip.mainActivitiesMap
          );

          if (selectedIndex > -1) {
            trip.days[index].addToPartOne(
              categoryInstance.baseCategory.Points[selectedIndex],
              categoryInstance.baseCategory.UsuallySpentHours
            );
            trip.mainActivitiesMap[categoryInstance.baseCategory.Points[selectedIndex].ID] = true;
            categoryInstance.baseCategory.Points.splice(selectedIndex, 1);
            categoryInstance.baseCategory.incSelectedPointCount();
          }
        }
      }

      arr = getCombinationOptions(categoryPreferences);

      const resultsPartTwo = combination(arr, tripSettings.PartTwoHours);
      const partTwoResultsRatings: number[] = rateCombinations(resultsPartTwo);
      const maxRatingIndexPartTwo = partTwoResultsRatings.indexOf(Math.max(...partTwoResultsRatings));

      for (
        let categoryInstanceIndex = 0;
        categoryInstanceIndex < resultsPartTwo[maxRatingIndexPartTwo].length;
        categoryInstanceIndex++
      ) {
        const categoryInstance: CategoryInstance = resultsPartTwo[maxRatingIndexPartTwo][categoryInstanceIndex];

        if (categoryInstance.baseCategory.Points && categoryInstance.baseCategory.Points.length) {
          const selectedIndex = checkDistance(
            [...trip.days[index].partOnePoints, ...trip.days[index].partTwoPoints],
            categoryInstance.baseCategory.Points,
            distanceMatrix,
            trip.mainActivitiesMap
          );

          if (selectedIndex > -1) {
            trip.days[index].addToPartTwo(
              categoryInstance.baseCategory.Points[selectedIndex],
              categoryInstance.baseCategory.UsuallySpentHours
            );
            trip.mainActivitiesMap[categoryInstance.baseCategory.Points[selectedIndex].ID] = true;
            categoryInstance.baseCategory.Points.splice(selectedIndex, 1);
            categoryInstance.baseCategory.incSelectedPointCount();
          }
        }
      }

      initCategoryCounter(categoryPreferences);
    }

    res.status(200).json({ data: trip });
  } catch (error) {
    next(error);
  }

  res.status(200).end();
};
