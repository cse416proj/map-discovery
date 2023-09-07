import React, { useState } from "react";
import Box from "@mui/material/Box";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import Fileupload from "./Fileupload";

export default function Dropdown() {
  const [fileFormat, setFileFormat] = useState("");

  const handleChange = (event) => {
    setFileFormat(event.target.value);
  };

  return (
    <Box sx={{ minWidth: 150 }}>
      <FormControl>
        <InputLabel id="map-format">Map format</InputLabel>
        <Select
          labelId="map-format-dropdown"
          id="map-format-dropdown"
          value={fileFormat}
          label="file-format"
          style={{ width: "150px" }}
          onChange={handleChange}
        >
          <MenuItem value="Shapefiles">Shapefiles</MenuItem>
          <MenuItem value="GeoJSON">GeoJSON</MenuItem>
          <MenuItem value="Keyhole(KML)">Keyhole(KML)</MenuItem>
        </Select>
      </FormControl>
      <Fileupload fileFormat={fileFormat} />
    </Box>
  );
}
