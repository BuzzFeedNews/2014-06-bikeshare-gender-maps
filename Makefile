default:
	@echo "No default rule"

DATES = 2013-07-01 2013-11-30
PROCESS = python scripts/process-data.py --date-range $(DATES)

nyc:
	$(PROCESS) --program nyc \
	--trips raw-data/nyc-merged.csv \
	--stations raw-data/nyc-merged.csv \
	> html/data/nyc.json

chicago:
	$(PROCESS) --program chicago \
	--trips raw-data/Divvy_Stations_Trips_2013/Divvy_Trips_2013.csv \
	--stations raw-data/Divvy_Stations_Trips_2013/Divvy_Stations_2013.csv \
	> html/data/chicago.json

boston:
	$(PROCESS) --program boston \
	--trips raw-data/hubway-updated-26-feb-2014/hubwaydata_10_12_to_11_13.csv \
	--stations raw-data/hubway-updated-26-feb-2014/stations_10_12_to_11_13.csv \
	> html/data/boston.json
