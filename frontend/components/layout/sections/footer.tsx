import { Separator } from "@/components/ui/separator";
import { 
  Wifi, 
  Phone, 
  Mail, 
  MapPin, 
  Clock,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Shield,
  Users,
  Headphones
} from "lucide-react";
import Link from "next/link";

export const FooterSection = () => {
  return (
    <footer id="footer" className="container ">
      <div className="p-10  rounded-2xl">
        <div className="pt-6 border-t border-secondary">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Social Media */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Follow us:</span>
              <div className="flex gap-2">
                <Link href="#" className="p-2 rounded-lg border border-secondary hover:bg-primary hover:text-white transition-colors">
                  <Facebook className="w-4 h-4" />
                </Link>
                <Link href="#" className="p-2 rounded-lg border border-secondary hover:bg-primary hover:text-white transition-colors">
                  <Twitter className="w-4 h-4" />
                </Link>
                <Link href="#" className="p-2 rounded-lg border border-secondary hover:bg-primary hover:text-white transition-colors">
                  <Instagram className="w-4 h-4" />
                </Link>
                <Link href="#" className="p-2 rounded-lg border border-secondary hover:bg-primary hover:text-white transition-colors">
                  <Linkedin className="w-4 h-4" />
                </Link>
                <Link href="#" className="p-2 rounded-lg border border-secondary hover:bg-primary hover:text-white transition-colors">
                  <Youtube className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Link href="https://wa.me/6289685402863" className="flex items-center gap-1 px-3 py-1 text-sm bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors">
                <Users className="w-4 h-4" />
                Customer Service
              </Link>
            </div>
          </div>
        </div>

        <Separator className="my-6" />
        
        {/* Bottom Section */}
        <section className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-muted-foreground">
            <p>&copy; 2025 DetsoNet. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="#" className="hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="#" className="hover:text-primary transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Shield className="w-4 h-4 text-green-500" />
            <span className="text-muted-foreground">SSL Secured</span>
          </div>
        </section>
      </div>
    </footer>
  );
};