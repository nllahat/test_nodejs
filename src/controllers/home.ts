import { Request, Response, NextFunction } from "express";
import { TripSettings } from "../models/tripSettings";
import * as GoogleMaps from "@google/maps";
import { DistanceMatrix } from "../models/distanceMatrix";
import { Trip, TripDay } from "../models/trip";
import { TripConfigurations, CategoriesMap } from "../models/tripConfigurations";
import { Constants } from "../config/constants";
import { BaseCategory, Point, GeoLocation } from "../models/categories/baseCategory";

const cacheMatrix: DistanceMatrix = null;

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

export const getActivities = async (req: Request, res: Response, next: NextFunction) => {
  const maxLocations = 20;
  const maxTo = Math.floor(maxLocations / 2);

  const googleMapsClient = GoogleMaps.createClient({
    Promise: Promise,
    key: "AIzaSyDYaVhAvMrNzI5UxA0vinTsJ2kZxb_tTkk"
  });

  const bodyCategoryPreferences: BodyCategoryPreferences = req.body.categoryPreferences;
  const bodyTripSettings = req.body.tripSettings;

  const tripSettings: TripSettings = new TripSettings(
    bodyTripSettings.days,
    bodyTripSettings.city,
    bodyTripSettings.mainActivitiesPerDay,
    bodyTripSettings.otherActivitiesPerDay
  );

  const categoryPreferences: CategoriesMap = {};

  Object.keys(bodyCategoryPreferences).forEach((key: string) => {
    categoryPreferences[key] = new BaseCategory(
      key,
      bodyCategoryPreferences[key],
      Constants.USUALLY_SPENT[key] || Constants.USUALLY_SPENT["default"]
    );
  });

  const tripConfigurations: TripConfigurations = new TripConfigurations(categoryPreferences, tripSettings);
  // if (cacheMatrix === null) {
  try {
    const promises: Array<Promise<GoogleMaps.ClientResponse<GoogleMaps.PlaceSearchResponse>>> = [];
    // const results;

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

    const points: Point[] = tripConfigurations.getAllPoints();
    const numberOfChunks = Math.ceil(points.length / maxTo);
    const distanceMatrix = new DistanceMatrix(points.length);

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

    const trip: Trip = new Trip(tripSettings.Days);

    for (let index = 0; index < trip.days.length; index++) {
      trip.days[index] = new TripDay(tripSettings.MainActivitiesPerDay, tripSettings.OtherActivitiesPerDay);
    }

    Object.keys(tripConfigurations.CategoryPreferences).forEach(categoryName => {
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
          if (trip.days[dayIndex].mainActivities.length < trip.days[dayIndex].maxMainActivities) {
            const selectedIndex = checkDistance(
              trip.days[dayIndex].mainActivities,
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
    });

    Object.keys(tripConfigurations.CategoryPreferences).forEach(categoryName => {
      const categoryPoints = [...tripConfigurations.CategoryPreferences[categoryName].Points];

      if (!categoryPoints || !categoryPoints.length) {
        return;
      } else {
        let counter = 0;
        for (
          let dayIndex = 0;
          dayIndex < trip.days.length && counter < tripConfigurations.NumberOfActivitiesPerCategory[categoryName];
          dayIndex++
        ) {
          if (trip.days[dayIndex].activities.length < trip.days[dayIndex].maxActivities) {
            const selectedIndex = checkDistance(
              trip.days[dayIndex].activities,
              categoryPoints,
              distanceMatrix,
              trip.mainActivitiesMap
            );

            if (selectedIndex > -1) {
              trip.days[dayIndex].addActivity(categoryPoints[selectedIndex]);
              trip.mainActivitiesMap[categoryPoints[selectedIndex].ID] = true;
              counter++;

              categoryPoints.splice(selectedIndex, 1);
            }
          }
        }
      }
    });

    res.status(200).json({ data: trip });
  } catch (error) {
    next(error);
  }
  //}

  // cacheMatrix.printGraph();

  res.status(200).end();
};
