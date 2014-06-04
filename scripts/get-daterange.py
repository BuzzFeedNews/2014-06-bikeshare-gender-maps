#!/usr/bin/env python
from bikeshares import programs
import argparse
import sys

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
    args = parser.parse_args()
    return args

def main():
    args = parse_args()
    program = args.program()
    program.load_trips(args.trips)
    time_range = program.trips.get_time_range()
    dformat = lambda d: d.strftime("%Y-%m-%d") 
    output = "{0} {1}\n".format(*map(dformat, time_range))
    sys.stdout.write(output)
    
if __name__ == "__main__":
    main()

