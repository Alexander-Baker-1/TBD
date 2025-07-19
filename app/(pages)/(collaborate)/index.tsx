/*
 import { Link } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Text>Collaborate</Text>
      <Link href="/details">View details</Link>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
*/

import React from 'react';
import { ScrollView, View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function CollaborateScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.header}>Collaborate</Text>

        {/* New Track Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>New Track</Text>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add-circle-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Your Projects */}
        <Text style={styles.subheader}>Your Projects</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            {renderProject("Quiet and Falling", "https://static.wikitide.net/celestewiki/thumb/f/f9/Celeste_ost_cover.png/400px-Celeste_ost_cover.png")}
            {renderProject("King of Sweden", "https://f4.bcbits.com/img/a4076732943_16.jpg")}
          </View>
          <View style={styles.row}>
            {renderProject("Resurrections", "https://static.wikitide.net/celestewiki/thumb/f/f9/Celeste_ost_cover.png/400px-Celeste_ost_cover.png")}
            {renderProject("Through the Roses", "https://f4.bcbits.com/img/a4076732943_16.jpg")}
          </View>
        </View>

        {/* Collaborators */}
        <Text style={styles.subheader}>Collaborators</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            {renderCollaborator("Fred again..", "https://randomuser.me/api/portraits/men/32.jpg")}
            {renderCollaborator("DJ Khaled", "https://randomuser.me/api/portraits/men/31.jpg")}
          </View>
          <View style={styles.row}>
            {renderCollaborator("Oliver Tree", "https://randomuser.me/api/portraits/men/30.jpg")}
            {renderCollaborator("Jim Halpert", "https://randomuser.me/api/portraits/men/29.jpg")}
          </View>
        </View>

        {/* Spacer to allow scrolling past bottom nav */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const renderProject = (name: string, imageUri: string) => (
  <View style={styles.item}>
    <Image source={{ uri: imageUri }} style={styles.image} />
    <Text style={styles.itemText}>{name}</Text>
  </View>
);

const renderCollaborator = (name: string, imageUri: string) => (
  <View style={styles.item}>
    <Image source={{ uri: imageUri }} style={styles.avatar} />
    <Text style={styles.itemText}>{name}</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  scroll: {
    padding: 16, //sides
    paddingBottom: 80, // space below bottom nav
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 0,
    marginBottom: 16,
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  addButton: {
    marginLeft: 8,
  },
  subheader: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 10,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  item: {
    alignItems: 'center',
    width: '45%',
  },
  image: { //project pictures
    width: 60,
    height: 60,
    borderRadius: 12,
    marginBottom: 8,
  },
  avatar: { //collaboratr pictures
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
  },
  itemText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
});
