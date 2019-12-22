import { Request, Response, NextFunction } from "express";
import { TripSettings } from "../models/tripSettings";
import * as GoogleMaps from "@google/maps";
import { DistanceMatrix } from "../models/distanceMatrix";
import { Trip, TripDay, Activity } from "../models/trip";
import { TripConfigurations, CategoriesMap, CategoriesNumOfActivitiesMap } from "../models/tripConfigurations";
import { Constants } from "../config/constants";
import { BaseCategory } from "../models/categories/baseCategory";

let cacheMatrix: DistanceMatrix = null;

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
    bodyTripSettings.mainActivitiesPerDay
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
  if (cacheMatrix === null) {
    try {
      const promises: Array<Promise<GoogleMaps.ClientResponse<GoogleMaps.PlaceSearchResponse>>> = [];
      const results;

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
        tripConfigurations.CategoryPreferences[Object.keys(tripConfigurations.CategoryPreferences)[index]].addPoint;

      }

      const mainPerCategory: CategoriesNumOfActivitiesMap = tripConfigurations.NumberOfMainActivitiesPerCategory;

      const museums: GoogleMaps.PlaceSearchResult[] = searchPlacesResults[0].json.results;
      const sights: GoogleMaps.PlaceSearchResult[] = searchPlacesResults[1].json.results;
      const shopping: GoogleMaps.PlaceSearchResult[] = searchPlacesResults[2].json.results;

      const numberOfMainActivitiesMuseums = UserPreferences.calculateNumOfMainActivities(
        UserPreferences.categoryNumberOfActivities(
          tripSettings.TotalHours,
          tripSettings.UsuallySpent.museums,
          tripConfigurations.Museums
        ),
        tripConfigurations.Museums
      );
      const numberOfMainActivitiesMuseumsPerDay = Math.ceil(numberOfMainActivitiesMuseums / tripSettings.Days);
      const numberOfMainActivitiesSights = UserPreferences.calculateNumOfMainActivities(
        UserPreferences.categoryNumberOfActivities(
          tripSettings.TotalHours,
          tripSettings.UsuallySpent.sights,
          tripConfigurations.Sights
        ),
        tripConfigurations.Sights
      );
      const numberOfMainActivitiesSightsPerDay = Math.ceil(numberOfMainActivitiesSights / tripSettings.Days);
      const numberOfMainActivitiesShopping = UserPreferences.calculateNumOfMainActivities(
        UserPreferences.categoryNumberOfActivities(
          tripSettings.TotalHours,
          tripSettings.UsuallySpent.shopping,
          tripConfigurations.Shopping
        ),
        tripConfigurations.Shopping
      );
      const numberOfMainActivitiesShoppingPerDay = Math.ceil(numberOfMainActivitiesShopping / tripSettings.Days);

      const topMuseums = museums.slice(0, numberOfMainActivitiesMuseums);
      const otherMuseums = museums.slice(
        numberOfMainActivitiesMuseums,
        UserPreferences.categoryNumberOfActivities(
          tripSettings.TotalHours,
          tripSettings.UsuallySpent.museums,
          tripConfigurations.Museums
        )
      );

      const topShoppings = shopping.slice(0, numberOfMainActivitiesShopping);
      const otherShoppings = shopping.slice(
        numberOfMainActivitiesShopping,
        UserPreferences.categoryNumberOfActivities(
          tripSettings.TotalHours,
          tripSettings.UsuallySpent.shopping,
          tripConfigurations.Shopping
        )
      );

      const topSights = sights.slice(0, numberOfMainActivitiesSights);
      const otherSights = sights.slice(
        numberOfMainActivitiesSights,
        UserPreferences.categoryNumberOfActivities(
          tripSettings.TotalHours,
          tripSettings.UsuallySpent.sights,
          tripConfigurations.Sights
        )
      );
      const results = {
        museums: {
          top: topMuseums,
          other: otherMuseums
        },
        shopping: {
          top: topShoppings,
          other: otherShoppings
        },
        sights: {
          top: topSights,
          other: otherSights
        }
      };

      interface InterfaceMap {
        [k: string]: GoogleMaps.PlaceSearchResult;
      }

      const points = [...topMuseums, ...otherMuseums, ...topShoppings, ...otherShoppings, ...topSights, ...otherSights];
      const numberOfChunks = Math.ceil(points.length / maxTo);
      const distanceMatrix = new DistanceMatrix(points.length);

      for (let i = 0; i < numberOfChunks; i++) {
        const fromIIndex = i * maxTo;
        const first = points.slice(fromIIndex, fromIIndex + maxTo);
        const fromStrArr = first.map(mus => [mus.geometry.location.lat, mus.geometry.location.lng].join(","));
        const fromPointsStr: GoogleMaps.LatLng[] = [fromStrArr.join("|")];

        for (let j = i; j < numberOfChunks; j++) {
          const fromJIndex = j * maxTo;
          const second = points.slice(fromJIndex, fromJIndex + maxTo);
          const toStrArr = second.map(mus => [mus.geometry.location.lat, mus.geometry.location.lng].join(","));
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

      cacheMatrix = distanceMatrix;

      const trip: Trip = new Trip(tripSettings.Days);

      // Spread main museums per day
      for (let index = 0; index < trip.days.length; index++) {
        trip.days[index] = new TripDay(tripSettings.MainActivitiesPerDay);

        if (topMuseums.length) {
          const museum = topMuseums.shift();
          trip.days[index].addActivity(new Activity(museum.place_id, museum.name));
        }
      }
    } catch (error) {
      next(error);
    }
  }

  cacheMatrix.printGraph();

  res.status(200).end();
};
