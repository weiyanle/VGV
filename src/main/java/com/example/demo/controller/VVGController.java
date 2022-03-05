package com.example.demo.controller;
import com.example.demo.dao.NCOVSeqDao;
import com.example.demo.domain.MulSeq;
import com.example.demo.domain.NCOVSeq;
import com.example.demo.utils.MulAlign;
import org.apache.coyote.http11.filters.SavedRequestInputFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.util.ClassUtils;
import org.springframework.web.bind.annotation.*;

import java.io.*;
import java.util.*;

@Controller
public class VVGController {
    //String exepath="D:\\毕设\\exe";
    String exepath="/root/exe";

    @Autowired
    NCOVSeqDao ncovseqdao;

    @RequestMapping("/")
    public String index (){
        return "redirect:/home";
    }

    @RequestMapping("/home")
    public String home (){
        return "home";
    }

    @RequestMapping("/documentation")
    public String document (){
        return "docu";
    }

    @RequestMapping("/gb")
    public String gb (){
        return "redirect:/gb/spe=NC_045512.2&loc=0:5439..5629&track=seq+ref+pro+proreg+prodom+prostr+prorep+gcp+trs";
    }

    @RequestMapping("/gb/spe={spe}&loc={Chr}:{start}..{end}&track={track}")
    public String indexgb (){
        return "gb";
    }

    @RequestMapping("/mul")
    public String mul() {
        return "redirect:/mul/jobID=Protein_1099455372";
    }

    @RequestMapping("/mul/jobID={jobID}")
    public String inmul(@PathVariable String jobID, Model model) throws IOException {
        File workdir=new File(exepath+"/workdir/"+jobID);
        if(workdir.exists()){
            File jsondir=new File(exepath+"/workdir/"+jobID+"/seq.json");
            if(jsondir.exists()){
                BufferedReader in = new BufferedReader(new FileReader(exepath+"/workdir/"+jobID+"/ncs"));
                model.addAttribute("lines",getTracks(in.readLine()));
                in = new BufferedReader(new FileReader(exepath+"/workdir/"+jobID+"/ex.phy"));
                String line;
                StringBuilder phystr=new StringBuilder();
                while ((line=in.readLine())!=null){
                    phystr.append(line);
                }
                model.addAttribute("phystr",phystr);
                in.close();
                return "mul";
            }else{
                return "redirect:/select_sequences/Running_"+jobID;
            }
        }
        return "redirect:/select_sequences/Wrong_"+jobID;
    }

    @RequestMapping("/json/mul/jobID={jobID}")
    @ResponseBody
    public String mulJson(@PathVariable String jobID) throws IOException {
        BufferedReader in = new BufferedReader(new FileReader(exepath+"/workdir/"+jobID+"/seq.json"));
        String ret=in.readLine();
        in.close();
        return ret;
    }

    @RequestMapping("/select_species")
    public String selectspe (Model model){
        model.addAttribute("lines",getTracks("all"));
        return "selectspe";
    }

    @RequestMapping("/select_sequences")
    public String selectseque (Model model){
        model.addAttribute("lines",getTracks("all"));
        model.addAttribute("status","Select");
        return "selectseque";
    }

    @RequestMapping("/select_sequences/{status}")
    public String selected (@PathVariable String status,Model model){
        model.addAttribute("lines",getTracks("all"));
        model.addAttribute("status",status);
        return "selectseque";
    }

    @RequestMapping("/ncov/select_sequences")
    public String selectncov (){return "selectncov";}

    @RequestMapping("/ncov/show")
    public String ncov (){
        return "redirect:/ncov?giss=1jaA1sRx1vp62LmX1yg94xNj2eU92GjF2ttw3a7c29gt6PL53irK8q4L2gnZ30lS5HKJ5LBj6pyM5cz94f6q9NOa6fyx6AWW6yEe8VAL9pWiBD20BFUw2FtA5L2l2EyS3aZY2hfs35gL2irk320f3Gl66Nzh4TIk4gfU5qaH5tNk9pkG502vASTp2wEi518U4Mio46EQ5Ssx6xud8WKU6AAyASSdBOMvBJIAAVQE1jrV1zZJ1wRq2GQP9Mf429VX4CPE5r7U6atw7C0H33wM5cn58Q2b3Xxw3BlQ4MYf3AZT4OoF5wDK5An35VqR7M2T6AYlB1jH8ZY3AyvMAYkp4XQJ3gYV5Mii7Cgt4Kjj56vh66zu71u07G8P8Gao9g2LAv5wBIZm2yNF3vlz5SIl7AWQ39W17BLq4RwM4GQy59129PWK68a47nA49LdE23TC1l982Qdg20xC3KAM3wpi20xt4MXw2IaP3GhU58oO29gu39Qd386Z3A4x2lpn3bfQ443t6Fgd3utB3bkM8Eeq7Cgn5yaP4lup6G1h9a6e7Xdu9N0KA5gi1i6v25Bp25Cz25gP1t762BxN29zr5FMV3NqF6Iy42VFE5S3Y2lpX3quP6Iyq6vmF6J0R6oPc7fQ08ptu87hq9r14AxJg9N8k4S0B5I27B1iS93Ef6ABGAV0B8GPEAG0cAUzjBkrOBPDU1gbt20oi1uZT28od1kMM2y801v6w2vnw2RR63Z2h3Q5IBNDY7Bw96QcX2m1g5UAz5Xzo4td35UBZ7D0VBDMn93Om4f314f7U3K7f25AL38HO2Gil2FZC3PSn2IaL2IZk3MmH5rGN40Tt3iry3b273jaF4FxI87inAlf99Yc66qx57zXRAlfNB9fE2DwF2Bl82Byj2Mxu2MWT2TsH79Nb5jYB6YmP7Mp19QVEA5g9AWCyBZOK79QKAADh7zR49jqO5XmEAdx9AdvZAdvx6dnv6dYDB9QuAxAc4lmq6YFp98jVBOhdB84WBDQy3Gkz5QE87VghAkYt6uz47XpLA4rAAPkPAHYbAHZCAHZ3BDAA8pr1AuZn4hzy&track=19A+19B+20A+20B+20C+20D+20E+20F+20G+20H+20I+20J+21A+21B+21C+21D+21E+21F+21G+21H";
    }

    @RequestMapping("/ncov")
    public String ncov (String clade){
        return "ncov";
    }

    @RequestMapping("/ncov/postdata")
    @ResponseBody
    public List<NCOVSeq> getStrainseq (String giss){
        if(!giss.equals("ALL")) {
            List<String> item = new ArrayList<>();
            for(int i=0;i<giss.length();i+=4){
                item.add(giss.substring(i,i+4));
            }
            return ncovseqdao.getByVgvNumber(item);
        }else return ncovseqdao.getALL();
    }

    @RequestMapping("/ncov/tableGet")
    @ResponseBody
    public List<NCOVSeq> tableGet (){
        return ncovseqdao.getAllButSeq();
    }

    public List<String[]> getTracks(String spe){
        //String pathname= ClassUtils.getDefaultClassLoader().getResource("static/track/tracks.txt").getPath();
        String line;
        List<String[]> lines=new ArrayList<String[]>();
        try{
            //FileReader reader = new FileReader(pathname);
            //BufferedReader br = new BufferedReader(reader);
            InputStream is=ClassUtils.getDefaultClassLoader().getResourceAsStream("static/track/tracks.txt");
            BufferedReader br=new BufferedReader(new InputStreamReader(is));
            while ((line=br.readLine())!=null){
                if(line.charAt(0)!='#')
                    if(spe=="all"||spe.indexOf(line.split("\t")[2])!=-1)
                        lines.add(line.split("\t"));
            }
        } catch (IOException e){
            e.printStackTrace();
        }
        return lines;
    }

    @RequestMapping("/select_sequences/postdata")
    @ResponseBody
    public String getSeqs(@RequestBody List<MulSeq> seqlist) throws IOException, InterruptedException {
        MulAlign mulalign=new MulAlign(seqlist,exepath,exepath+"/workdir");
        return mulalign.getJobID();
    }
}

