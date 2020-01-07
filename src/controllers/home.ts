import { Request, Response, NextFunction } from "express";
import { TripSettings } from "../models/tripSettings";
import * as GoogleMaps from "@google/maps";
import { DistanceMatrix } from "../models/distanceMatrix";
import { Trip, TripDay } from "../models/trip";
import { TripConfigurations, CategoriesMap } from "../models/tripConfigurations";
import { Constants } from "../config/constants";
import { BaseCategory, Point, GeoLocation } from "../models/categories/baseCategory";

const cacheMatrix: DistanceMatrix = null;
const googleMapsClient = GoogleMaps.createClient({
  Promise: Promise,
  key: "AIzaSyDYaVhAvMrNzI5UxA0vinTsJ2kZxb_tTkk"
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
  let minDistance = 5000; // 5 km
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
        minDistance = distanceMatrix.matrix[i][j];
      }
    }
  }

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
  const promises: Array<Promise<GoogleMaps.ClientResponse<GoogleMaps.PlaceSearchResponse>>> = [];

  Object.keys(tripConfigurations.CategoryPreferences).forEach(categoryName => {
    promises.push(
      googleMapsClient
        .places({
          query: categoryName + " " + tripSettings.City
        })
        .asPromise()
    );
  });

  const searchPlacesResults: Array<GoogleMaps.ClientResponse<GoogleMaps.PlaceSearchResponse>> = await Promise.all(promises);

  for (let index = 0; index < Object.keys(tripConfigurations.CategoryPreferences).length; index++) {
    for (let resultIndex = 0; resultIndex < searchPlacesResults[index].json.results.length; resultIndex++) {
      const googlePoint = searchPlacesResults[index].json.results[resultIndex];
      const point: Point = new Point(
        googlePoint.place_id,
        googlePoint.name,
        new GeoLocation(googlePoint.geometry.location.lat, googlePoint.geometry.location.lng)
      );

      tripConfigurations.CategoryPreferences[Object.keys(tripConfigurations.CategoryPreferences)[index]].addPoint(point);
    }
  }
}

async function fillDistanceMatrixByPoint(numberOfChunks: number, maxTo: number, points: Point[], distanceMatrix: DistanceMatrix) {
  for (let i = 0; i < numberOfChunks; i++) {
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
  }

  for (let pointIndex = 0; pointIndex < points.length; pointIndex++) {
    points[pointIndex].DistanceMatrixIndex = pointIndex;
  }
}

function uniqueCombination(l, sum, K, local, arr, totalResults) {
  // If a unique combination is found
  if (sum == K) {
    totalResults.push([...local]);

    return;
  }

  // For all other combinations
  for (let i = l; i < arr.length; i++) {
    // Check if the sum exceeds K
    if (sum + arr[i] > K) {
      continue;
    }

    // Check if it is repeated or not
    if (i && arr[i] == arr[i - 1] && i > l) {
      continue;
    }

    // Take the element into the combination
    local.push(arr[i]);

    // Recursive call
    uniqueCombination(i + 1, sum + arr[i], K, local, arr, totalResults);

    // Remove element from the combination
    local.pop();
  }
}

// Function to find all combination
// of the given elements
function combination(arr, K) {
  arr.sort();
  const allResults = [];

  for (let index = 0; index < K; ) {
    const local = [];
    const totalResults = [];

    uniqueCombination(0, 0, K - index, local, arr, totalResults);

    if (totalResults.length) {
      for (const result of totalResults) {
        console.log(result.join(","));
        allResults.push(result);
      }
    }

    index += 0.5;
  }

  return allResults;
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
    const distanceMatrix = new DistanceMatrix(points.length);
    await fillDistanceMatrixByPoint(numberOfChunks, maxTo, points, distanceMatrix);
    const trip: Trip = new Trip(tripSettings.Days);

    for (let index = 0; index < trip.days.length; index++) {
      trip.days[index] = new TripDay(tripSettings.PartOneHours, tripSettings.PartTwoHours);
    }

    combination([2, 2, 2, 1.5], 3);

    /* Object.keys(tripConfigurations.CategoryPreferences).forEach(categoryName => {
      const categoryPoints = [...tripConfigurations.CategoryPreferences[categoryName].Points];

      if (!categoryPoints || !categoryPoints.length) {
        return;
      } else {
        let mainCounter = 0;
        for (
          let dayIndex = 0;
          dayIndex < trip.days.length && mainCounter < tripConfigurations.NumberOfMainActivitiesPerCategory[categoryName];
          dayIndex++
        ) {
          if (trip.days[dayIndex].partTwoPoint.length < trip.days[dayIndex].maxMainActivities) {
            const selectedIndex = checkDistance(
              trip.days[dayIndex].partTwoPoint,
              categoryPoints,
              distanceMatrix,
              trip.mainActivitiesMap
            );

            if (selectedIndex > -1) {
              trip.days[dayIndex].addMainActivity(categoryPoints[selectedIndex]);
              trip.mainActivitiesMap[categoryPoints[selectedIndex].ID] = true;
              mainCounter++;

              categoryPoints.splice(selectedIndex, 1);
            }
          }
        }
      }
    }); */

    res.status(200).json({ data: trip });
  } catch (error) {
    next(error);
  }
  //}

  // cacheMatrix.printGraph();

  res.status(200).end();
};
