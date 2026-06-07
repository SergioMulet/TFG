import { StyleSheet } from "react-native";

export const COLORS = {
  background: "#E8EEFA",
  cardBackground: "#B3C7F0",
  border: "#071D64",
  text: "#071D64",
  placeholder: "#071d6481",
};

const globalStyles = (isPhone: boolean) =>
  StyleSheet.create({
    scrollContainer: {
      flex: 1,
      backgroundColor: COLORS.background,
    },

    screenContainer: {
      backgroundColor: COLORS.background,
      justifyContent: "center",
      alignItems: "center",
      marginHorizontal: isPhone ? 0 : "25%",
      marginTop: isPhone ? "20%" : 0,
      padding: 20,
    },

    dropdownContainer: {
      backgroundColor: COLORS.cardBackground,
      borderColor: "#071D64",
      borderRadius: 15,
      borderWidth: 1,
    },

    menuBar: {
      flexDirection: "row",
      justifyContent: "flex-end",
      width: "100%",
    },

    flagEmoji: {
      fontSize: 50,
    },

    boatCard: {
      backgroundColor: COLORS.cardBackground,
      borderColor: "#071D64",
      borderRadius: 15,
      borderWidth: 1,

      padding: "5%",
      width: "100%",
      margin: "5%",
      flexDirection: "column",
      justifyContent: "space-between",
      alignItems: "center",
    },

    boatTitle: {
      fontSize: 36,
      fontWeight: "bold",
      color: COLORS.text,
      textAlign: "center",
    },

    coordinatesTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: COLORS.text,
      textAlign: "center",
      marginBottom: "5%",
    },

    textInfo: {
      fontSize: 18,
      color: COLORS.text,
      textAlign: "left",
    },
  });

export default globalStyles;
