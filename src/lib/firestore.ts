import { collection, addDoc, getDocs, query, where, orderBy, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

// Types
export interface User {
  uid: string
  email: string
  name: string
  role: string
  dob: Date
}

export interface Child {
  id?: string
  name: string
  gender: string
  motherId: string
  createdBy: string
  createdAt: Date
}

export interface GrowthRecord {
  id?: string
  height: string
  month: number
  inputBy: string
  recordAt: Date
}

// User functions
export const getAllMothers = async (): Promise<User[]> => {
  try {
    console.log("Fetching mothers from Firestore...")
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("role", "==", "mother"))
    const querySnapshot = await getDocs(q)

    console.log("Found", querySnapshot.docs.length, "mothers")

    return querySnapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
      dob: doc.data().dob.toDate(),
    })) as User[]
  } catch (error) {
    console.error("Error getting mothers:", error)
    throw error
  }
}

// Children functions
export const addChild = async (childData: Omit<Child, "id" | "createdAt">): Promise<string> => {
  try {
    console.log("Adding child:", childData)
    const childrenRef = collection(db, "children")
    const docRef = await addDoc(childrenRef, {
      ...childData,
      createdAt: Timestamp.now(),
    })
    console.log("Child added with ID:", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("Error adding child:", error)
    throw error
  }
}

export const getChildrenByMother = async (motherId: string): Promise<Child[]> => {
  try {
    console.log("Fetching children for mother:", motherId)
    const childrenRef = collection(db, "children")
    const q = query(childrenRef, where("motherId", "==", motherId))
    const querySnapshot = await getDocs(q)

    console.log("Found", querySnapshot.docs.length, "children")

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
    })) as Child[]
  } catch (error) {
    console.error("Error getting children:", error)
    throw error
  }
}

// Growth Record functions
export const addGrowthRecord = async (
  childId: string,
  recordData: Omit<GrowthRecord, "id" | "recordAt">,
): Promise<string> => {
  try {
    console.log("Adding growth record for child:", childId, recordData)
    const growthRecordRef = collection(db, "children", childId, "growthRecord")
    const docRef = await addDoc(growthRecordRef, {
      ...recordData,
      recordAt: Timestamp.now(),
    })
    console.log("Growth record added with ID:", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("Error adding growth record:", error)
    throw error
  }
}

export const getGrowthRecords = async (childId: string): Promise<GrowthRecord[]> => {
  try {
    console.log("Fetching growth records for child:", childId)
    const growthRecordRef = collection(db, "children", childId, "growthRecord")
    const q = query(growthRecordRef, orderBy("month", "asc"))
    const querySnapshot = await getDocs(q)

    console.log("Found", querySnapshot.docs.length, "growth records")

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      recordAt: doc.data().recordAt.toDate(),
    })) as GrowthRecord[]
  } catch (error) {
    console.error("Error getting growth records:", error)
    throw error
  }
}

export const getCompleteGrowthRecords = async (childId: string): Promise<GrowthRecord[]> => {
  const growthRecordRef = collection(db, "children", childId, "growthRecord")
  const q = query(growthRecordRef, orderBy("month", "asc"))
  const snapshot = await getDocs(q)

  const map = new Map<number, GrowthRecord>()
  snapshot.forEach(doc => {
  const data = doc.data() as GrowthRecord
  map.set(data.month, {
    id: doc.id,
    ...data,
    recordAt: (data.recordAt && typeof (data.recordAt as any).toDate === "function")
      ? (data.recordAt as any).toDate()
      : (data.recordAt ?? new Date()),
  })
})

  // Pastikan semua bulan 1–60 terisi
  const completeList: GrowthRecord[] = []
  for (let i = 1; i <= 60; i++) {
    completeList.push(
      map.get(i) ?? {
        month: i,
        height: "",
        inputBy: "",
        recordAt: new Date(),
      }
    )
  }

  return completeList
}
