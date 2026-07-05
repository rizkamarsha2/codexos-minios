// CodexSystem — load_time_data stub (adapted from Opera toolkit)
const loadTimeData = {
  data_: {},
  getString: function(key) { return this.data_[key] || key; },
  getBoolean: function(key) { return !!this.data_[key]; },
  getValue: function(key) { return this.data_[key]; },
  overrideValues: function(vals) { Object.assign(this.data_, vals); }
};
export default loadTimeData;
export { loadTimeData };
