import { StyleSheet } from "react-native";

export const COLORS = {
  background: "#E8EEFA",
  cardBackground: "#B3C7F0",
  border: "#071D64",
  text: "#071D64",
  placeholder: "#071d6481",
  red: "#F79797"
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

    boatCard: {
      backgroundColor: COLORS.cardBackground,
      borderColor: COLORS.border,
      borderRadius: 15,
      borderWidth: 1,

      padding: "5%",
      width: "100%",
      margin: "5%",
      flexDirection: "column",
      justifyContent: "space-between",
      alignItems: "center",
    },

    title: {
      fontSize: 30,
      fontWeight: "bold",
      color: COLORS.text,
      textAlign: "center",
    },

    secondTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: COLORS.text,
      textAlign: "center",
      margin:"5%",
    },

    text: {
      fontSize: 18,
      color: COLORS.text,
      textAlign: "left",
    },

    loginCards: {
      backgroundColor: COLORS.cardBackground,
      borderColor: COLORS.border,
      borderRadius: 15,
      borderWidth: 1,

      padding: "5%",
      width: "100%",
      margin: "5%",
      flexDirection: "column",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
    },

    loginButton: {
      backgroundColor: COLORS.text,
      borderColor: "#FFFFFF",
      borderRadius: 15,
      borderWidth: 1,

      padding: "5%",
      width: "60%",
      margin: "5%",
      flexDirection: "column",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
    },

    signOutButton: {
      backgroundColor: COLORS.red,
      borderColor: COLORS.border,
      borderRadius: 15,
      borderWidth: 1,

      padding: "5%",
      width: "100%",
      margin: "5%",
      flexDirection: "column",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
    },

    loginText: {
      fontSize: 18,
      textDecorationLine: "underline",
      color: COLORS.text,
      textAlign: "center",
    },

    googleButton: {
      backgroundColor: "#ffffff",
      borderRadius: 15,
      borderWidth: 1,

      padding: "5%",
      width: "60%",
      margin: "5%",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: "5%",
      paddingVertical: 12,
    },

    googleText: {
      color: "#1f1f1f",
      fontWeight: "bold",
      fontSize: 16,
    },

    separatorContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: "1%",
      width: "100%",
    },

    separatorText: {
      color: COLORS.text,
      marginHorizontal: 16,
      fontSize: 14,
      opacity: 0.6,
      fontWeight: "bold",
    },

    separatorLine: {
      flex: 1,
      height: 1,
      backgroundColor: COLORS.placeholder,
      opacity: 0.25,
    },
  });

export default globalStyles;
