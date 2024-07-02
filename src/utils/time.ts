import dayjs from "dayjs"; // 引入 Day.js 库

type YYYYMMDDHHMMSS = string;
export const getFormattedTimestamp: () => YYYYMMDDHHMMSS = () => {
  return dayjs().format("YYYYMMDDHHmmss");
};
export function getCurrentDateFormatted(): string {
  return dayjs().format("YYYY-MM-DD");
}
export function getCurrentTimestamp(): number {
  return dayjs().unix();
}
export function getPreviousDateFormatted(): string {
  return dayjs().subtract(1, "day").format("YYYY-MM-DD");
}
export function getNextDateFormatted(): string {
  return dayjs().add(1, "day").format("YYYY-MM-DD");
}
export function isValidDate(dateString: string): boolean {
  return dayjs(dateString).isValid();
}
export function getDateDifference(
  dateString1: string,
  dateString2: string,
): number {
  return dayjs(dateString2).diff(dayjs(dateString1), "day");
}
export function getFormattedDateTime(): string {
  return dayjs().format("YYYY-MM-DDTHH:mm:ss");
}
export function getFirstDateOfMonthFormatted(): string {
  return dayjs().startOf("month").format("YYYY-MM-DD");
}
export function getLastDateOfMonthFormatted(): string {
  return dayjs().endOf("month").format("YYYY-MM-DD");
}
export function formatInputDateTime(input: Date): string {
  return dayjs(input).format("YYYY/MM/DD HH:mm:ss");
}
