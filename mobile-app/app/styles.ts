import { StyleSheet } from 'react-native';

const COLORS = {
  deepOcean: '#0A2540',  
  seaBlue: '#007AFF',
  skyBlue: '#E6F0FA',    
  background: '#F4F7FA', 
  white: '#FFFFFF',      
  textMuted: '#627D98',  
  indicatorOk: '#34C759' 
};

const globalStyles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  settingsCard:{
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    // shadows
    shadowColor: COLORS.deepOcean,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3, 
  },
  
  boatCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    marginBottom: 20,
    flexDirection: 'column',
    alignItems: 'center',
    // shadows
    shadowColor: COLORS.deepOcean,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3, 
  },

  boatTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.deepOcean,
    textAlign: 'center',
    marginBottom: 8,
  },

  boatSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    fontWeight: '500',
  },

  statusBadge: {
    backgroundColor: COLORS.skyBlue,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },

  statusText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.deepOcean,
  }
});

export default globalStyles