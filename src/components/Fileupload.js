import React, { useState, useRef, useEffect } from "react";
import { MapContainer, GeoJSON, TileLayer } from "react-leaflet";
import Button from "@mui/material/Button";
import "leaflet/dist/leaflet.css";
import ReactLeafletKml from "react-leaflet-kml";
import * as shapefile from "shapefile";
import shp from "shpjs";

export default function Fileupload({ fileFormat }) {
  const inputFile = useRef(null);
  const [fileContent, setFileContent] = useState("");
  const [geoJSON, setGeoJSON] = useState({});
  const [kml, setKml] = useState(null);
  const [shpBuffer, setShpBuffer] = useState(null);
  const [dbfBuffer, setDbfBuffer] = useState(null);

  useEffect(() => {
    if (shpBuffer && dbfBuffer) {
      let features = [];
      shapefile
        .open(shpBuffer, dbfBuffer)
        .then((source) =>
          source.read().then(function log(result) {
            if (result.done) {
              const geoJSON = {
                type: "FeatureCollection",
                features: features,
              };
              setFileContent(geoJSON);
              return;
            }
            features.push(result.value);
            return source.read().then(log);
          })
        )
        .catch((error) => console.error(error.stack));
    }
  }, [shpBuffer, dbfBuffer])

  const fileExtension = {
    GeoJSON: "json",
    Shapefiles: "shp/dbf/zip",
    "Keyhole(KML)": "kml",
  };

  function clearInputFile() {
    if (inputFile.current) {
      inputFile.current.value = "";
      inputFile.current.type = "file";
      inputFile.current.accept = ".zip, .json, .shp, .kml, .dbf";
    }
  }

  function readDataFromGeojsonFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      setFileContent(reader.result);
    };
    reader.readAsText(file);
  }

  function readDataFromShpFile(shpFile, dbfFile) {
    const shpReader = new FileReader();
    const dbfReader = new FileReader();
    shpReader.onload = (e) => {
      setShpBuffer(shpReader.result)
    }
    dbfReader.onload = (e) => {
      setDbfBuffer(dbfReader.result)
    }
    shpReader.readAsArrayBuffer(shpFile);
    dbfReader.readAsArrayBuffer(dbfFile);
  }

  function readDataFromShpZipFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      shp(reader.result).then(function (geojson) {
        console.log(geojson);
      });
    };
    reader.readAsArrayBuffer(file);
  }

  function readDataFromKMLFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      setFileContent(reader.result);
    };
    reader.readAsText(file);
  }

  const handleSelectFile = (event) => {
    setGeoJSON({});
    const fileCount = event.target.files.length

    // only process non-empty file that matches selected file extension
    if (event.target.files[0]) {
      const fileType = event.target.files[0].name.split(".").pop();
      const fileType2 = fileCount === 2 ? event.target.files[1].name.split(".").pop() : '';
      if ((fileFormat === 'Shapefiles' && (fileCount !== 2 || !fileExtension[fileFormat].includes(fileType2))) || !fileExtension[fileFormat].includes(fileType)) {
        alert("Unmatch upload file format.");
        clearInputFile();
      } else {
        if (fileFormat === "GeoJSON") {
          readDataFromGeojsonFile(event.target.files[0]);
        } else if (fileFormat === "Shapefiles") {
          if (fileType === "shp" || fileType === 'dbf') {
            var shpFile =  (fileType === "shp") ? event.target.files[0] : event.target.files[1];
            var dbfFile =  (fileType === "dbf") ? event.target.files[0] : event.target.files[1];
            readDataFromShpFile(shpFile, dbfFile);
          } else if (fileType === "zip") {
            readDataFromShpZipFile(event.target.files[0]);
          }
        } else if (fileFormat === "Keyhole(KML)") {
          readDataFromKMLFile(event.target.files[0]);
        }
      }
    }
  };

  const handleUpload = () => {
    if (fileContent) {
      if (fileFormat === "GeoJSON") {
        setGeoJSON(JSON.parse(fileContent));
      } else if (fileFormat === "Shapefiles") {
        setGeoJSON(fileContent);
      } else if (fileFormat === "Keyhole(KML)") {
        const kmlText = new DOMParser().parseFromString(
          fileContent,
          "text/xml"
        );
        setKml(kmlText);
      }
    }
  };

  const handleClear = () => {
    setFileContent("");
    setGeoJSON({});
    setKml(null);
    setDbfBuffer(null);
    setShpBuffer(null);
    clearInputFile();
  };

  const handleRegionDisplay = (country, layer) => {
    if (country.properties.admin) {
      layer.bindPopup(country.properties.admin);
    } else {
      const regionType =
        country.properties.ENGTYPE_1 || country.properties.ENGTYPE_2;
      layer.bindPopup(
        regionType === "Province"
          ? country.properties.NAME_1
          : regionType === "District"
          ? country.properties.NAME_2
          : country.properties.NAME_0
      );
    }
  };

  return (
    <div>
      <form>
        <input
          type="file"
          accept=".zip, .json, .shp, .kml, .dbf"
          multiple
          ref={inputFile}
          onChange={handleSelectFile}
        />
        <Button variant="contained" onClick={handleUpload}>
          Upload
        </Button>
        <Button variant="outlined" onClick={handleClear}>
          Clear Map
        </Button>
      </form>
      {geoJSON.features && (
        <MapContainer style={{ height: "80vh" }} center={[0, 0]} zoom={2}>
          <GeoJSON data={geoJSON} onEachFeature={handleRegionDisplay} />
        </MapContainer>
      )}
      {kml && (
        <MapContainer style={{ height: "80vh" }} center={[0, 0]} zoom={2}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          />
          <ReactLeafletKml kml={kml} />
        </MapContainer>
      )}
    </div>
  );
}
