#!/usr/bin/env python
from bikeshares import programs
from bikeshares.program import TripSubset
import pandas as pd
import argparse
import json
import sys

ROUNDING = 4

def get_program(name):
    return {
        "nyc": programs.nyc.CitiBike,
        "chicago": programs.chicago.Divvy,
        "boston": programs.boston.Hubway
    }[name]

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--program", type=get_program)
    parser.add_argument("--trips")
    parser.add_argument("--filetype", default="geojson",
        choices=["geojson", "csv"])
    parser.add_argument("--stations")
    parser.add_argument("--date-range", nargs=2)
    args = parser.parse_args()
    return args

def get_female_pct(subset):
    mean = (subset["rider_gender"] == "F").mean()
    return round(mean, ROUNDING)

def calculate_gender(program, date_range=(None, None)):
    # Limit by date range
    trips = program.trips.between_times(*date_range)
    if not len(trips.df): raise Exception("No trips during date range.")

    # Limit to only trips that contain gender information
    gender_constraint = trips["rider_gender"].notnull()
    gendered_subset = TripSubset(trips[gender_constraint])

    # Aggregated data by station, and calculate derived variables
    station_data = gendered_subset.by_station().set_index("station_id")
    station_data["fpct_started"] = gendered_subset.groupby("start_station").apply(get_female_pct)
    station_data["fpct_ended"] = gendered_subset.groupby("end_station").apply(get_female_pct)
    total_fpct = ((station_data["fpct_started"] * station_data["trips_started"]) +\
        (station_data["fpct_ended"] * station_data["trips_ended"])) / (station_data["trips_total"])
    station_data["fpct_total"] = total_fpct.apply(lambda x: round(x, ROUNDING))

    # Add station information
    stations = program.stations.set_index("id")[["name", "lat", "lng"]]\
        .join(station_data, how="right")

    stations[["lat", "lng"]] = stations[["lat", "lng"]].applymap(lambda x: round(float(x), 5))

    return stations.sort("trips_total", ascending=False).reset_index()

def station_to_geojson(station):
    keys = station.keys()
    geo_keys = [ "lng", "lat" ]
    ll = [ station[x] for x in geo_keys ]
    return {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": ll
        },
        "properties": dict((k, station[k])
            for k in set(keys) - set(geo_keys))
    }

def to_geojson(df):
    features = map(station_to_geojson, df.to_dict("records"))
    return {
        "type": "FeatureCollection",
        "features": list(f for f in features)
    }
    
def main():
    args = parse_args()
    program = args.program()
    program.load_trips(args.trips).load_stations(args.stations)
    calculations = calculate_gender(program, date_range=args.date_range)
    if args.filetype == "csv":
        calculations.to_csv(sys.stdout, index=False)
    elif args.filetype == "geojson":
        json.dump(to_geojson(calculations), sys.stdout)
    
if __name__ == "__main__":
    main()
