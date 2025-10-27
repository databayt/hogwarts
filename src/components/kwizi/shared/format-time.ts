import moment from "moment";

export const formatTime = (date: Date) => {
  return moment(date).format("Do MMMM YYYY, HH:mm");
};
