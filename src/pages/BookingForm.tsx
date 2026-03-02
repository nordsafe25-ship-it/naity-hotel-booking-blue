import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { hotels, getRooms } from "@/lib/mockData";
import Layout from "@/components/Layout";
import { toast } from "sonner";

const BookingForm = () => {
  const [searchParams] = useSearchParams();
  const hotelId = Number(searchParams.get("hotel"));
  const roomId = Number(searchParams.get("room"));
  const hotel = hotels.find((h) => h.id === hotelId);
  const room = hotel ? getRooms(hotel.id).find((r) => r.id === roomId) : null;
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulates POST /reservations
    toast.success("Reservation submitted successfully!");
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center space-y-4">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="inline-block">
            <CheckCircle className="w-16 h-16 text-primary mx-auto" />
          </motion.div>
          <h1 className="text-3xl font-extrabold text-accent">Booking Confirmed!</h1>
          <p className="text-muted-foreground">Your reservation has been sent to the hotel via Hajiz. You will receive a confirmation email shortly.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-extrabold text-accent mb-8"
        >
          Complete Your Booking
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5">
            <div className="bg-card rounded-xl p-6 shadow-card border border-border/50 space-y-4">
              <h2 className="font-semibold text-foreground text-lg">Guest Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "First Name", type: "text", required: true },
                  { label: "Last Name", type: "text", required: true },
                  { label: "Email", type: "email", required: true },
                  { label: "Phone", type: "tel", required: true },
                ].map((field) => (
                  <div key={field.label} className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">{field.label}</label>
                    <input
                      type={field.type}
                      required={field.required}
                      className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground focus:ring-2 focus:ring-primary/30 transition"
                      placeholder={field.label}
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Check-in</label>
                  <input type="date" required className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Check-out</label>
                  <input type="date" required className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Special Requests</label>
                <textarea
                  rows={3}
                  className="w-full bg-muted rounded-lg px-3 py-2.5 text-sm outline-none text-foreground resize-none focus:ring-2 focus:ring-primary/30 transition"
                  placeholder="Any special requests..."
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full gradient-cta text-primary-foreground py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Confirm Reservation
            </button>
          </form>

          {/* Summary */}
          <div className="bg-card rounded-xl p-6 shadow-card border border-border/50 h-fit space-y-4">
            <h2 className="font-semibold text-foreground text-lg">Reservation Summary</h2>
            {hotel && room ? (
              <>
                <img src={hotel.image} alt={hotel.name} className="w-full h-32 object-cover rounded-lg" />
                <div>
                  <h3 className="font-semibold text-foreground">{hotel.name}</h3>
                  <p className="text-sm text-muted-foreground">{hotel.city}</p>
                </div>
                <div className="border-t border-border pt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Room Type</span>
                    <span className="font-medium text-foreground">{room.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price/Night</span>
                    <span className="font-medium text-foreground">${room.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Guests</span>
                    <span className="font-medium text-foreground">Up to {room.capacity}</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No room selected. Please go back and choose a room.
              </p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BookingForm;
